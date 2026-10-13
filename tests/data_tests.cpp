#include "unimatch/data_validation.hpp"
#include <algorithm>
#include <fstream>
#include <functional>
#include <iostream>
#include <iterator>
#include <set>
#include <stdexcept>

using Json = nlohmann::json;
using namespace unimatch;
namespace {
int checks = 0;
void require(bool condition, const std::string& message) {
    ++checks;
    if (!condition) throw std::runtime_error(message);
}
std::string read(const std::string& path) {
    std::ifstream file(path);
    if (!file) throw std::runtime_error("Cannot read fixture: " + path);
    return {std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>()};
}
bool error_at(const std::vector<ValidationError>& errors, const std::string& path, const std::string& code) {
    return std::any_of(errors.begin(), errors.end(), [&](const ValidationError& error) {
        return error.path == path && error.code == code && !error.message.empty();
    });
}
std::string repeat(const std::string& unit, int count) {
    std::string result;
    for (int i = 0; i < count; ++i) result += unit;
    return result;
}
void production(const std::string& cats, const std::string& data) {
    const auto result = load_data(cats, data);
    for (const auto& error : result.errors) std::cerr << error.path << ": " << error.message << '\n';
    require(result.ok(), "Production data must validate as one complete bundle.");
    const auto& bundle = *result.value;
    require(bundle.dataset.profiles.size() == 45, "The production dataset must contain 45 profiles.");
    require(bundle.catalogues.universities.size() == 4, "Four universities expected.");
    std::set<std::string> campuses, genders, degrees, ids, names;
    int hidden = 0, without_year = 0, duplicate_names = 0, single_interest = 0, five_interests = 0;
    for (const auto& p : bundle.dataset.profiles) {
        require(p.age >= 18 && p.age <= 100, "Every production profile must be an adult.");
        require(p.id != visitor_id && ids.insert(p.id).second, "Stable profile IDs cannot collide.");
        campuses.insert(p.campus_id); genders.insert(p.gender_id); degrees.insert(p.degree_id);
        if (!names.insert(p.display_name).second) ++duplicate_names;
        if (!p.show_gender) ++hidden;
        if (!p.year_id) ++without_year;
        if (p.interest_ids.size() == 1) ++single_interest;
        if (p.interest_ids.size() == 5) ++five_interests;
    }
    require(campuses.size() == 9, "All nine campuses must appear.");
    require(genders.size() == bundle.catalogues.genders.size(), "Every gender option must appear.");
    require(degrees.size() == bundle.catalogues.degrees.size(), "Every field of study must appear.");
    require(hidden > 0 && hidden < 45 && without_year > 0, "Visibility and optional years must vary.");
    require(duplicate_names >= 2, "Duplicate display names must be present without duplicate IDs.");
    require(single_interest > 0 && five_interests > 0, "Both interest-count boundaries must be represented.");
    bool disjoint = false, substantial = false;
    for (std::size_t a = 0; a < bundle.dataset.profiles.size(); ++a)
        for (std::size_t b = a + 1; b < bundle.dataset.profiles.size(); ++b) {
            int overlap = 0;
            for (const auto& id : bundle.dataset.profiles[a].interest_ids)
                if (std::find(bundle.dataset.profiles[b].interest_ids.begin(), bundle.dataset.profiles[b].interest_ids.end(), id) != bundle.dataset.profiles[b].interest_ids.end()) ++overlap;
            disjoint = disjoint || overlap == 0;
            substantial = substantial || overlap >= 3;
        }
    require(disjoint && substantial, "Data must include disjoint and substantially overlapping interest sets.");
    require(!ApplicationState{}.visitor && ApplicationState{}.saved_ids.empty(), "Initial application state must contain no visitor or bookmarks.");
}
void invalid_cases(const std::string& cats, const std::string& data) {
    const auto catalogues = parse_catalogues(cats);
    require(catalogues.ok(), "Baseline catalogues must validate.");
    const auto catalogue_json = Json::parse(cats);
    const auto dataset_json = Json::parse(data);
    const auto cases = Json::parse(read("/fixtures/invalid_data_cases.json"));
    for (const auto& item : cases) {
        const std::string name = item.at("name");
        const std::string path = item.at("errorPath");
        const std::string code = item.at("errorCode");
        if (item.at("target") == "catalogues") {
            const auto changed = catalogue_json.patch(item.at("patch")).dump();
            const auto parsed = parse_catalogues(changed);
            require(!parsed.value && error_at(parsed.errors, path, code), "Fixture failed: " + name);
            require(!load_data(changed, data).value, "Bad catalogues cannot produce a bundle: " + name);
        } else {
            const auto changed = dataset_json.patch(item.at("patch")).dump();
            const auto parsed = parse_dataset(changed, *catalogues.value);
            require(!parsed.value && error_at(parsed.errors, path, code), "Fixture failed: " + name);
            require(!load_data(cats, changed).value, "Bad data cannot produce a partial bundle: " + name);
        }
    }
    for (const auto& malformed : {read("/fixtures/malformed.json"), std::string{}, std::string("[]"), std::string("null")}) {
        require(!parse_catalogues(malformed).ok(), "Invalid catalogue root must fail.");
        require(!parse_dataset(malformed, *catalogues.value).ok(), "Invalid dataset root must fail.");
    }
    auto multiple = dataset_json;
    multiple["profiles"][0]["age"] = 17;
    multiple["profiles"][0]["bio"] = " ";
    multiple["profiles"][0]["interestIds"] = Json::array();
    const auto parsed = parse_dataset(multiple.dump(), *catalogues.value);
    require(!parsed.value && error_at(parsed.errors, "/dataset/profiles/0/age", "range") &&
        error_at(parsed.errors, "/dataset/profiles/0/bio", "required") &&
        error_at(parsed.errors, "/dataset/profiles/0/interestIds", "interest_count"), "Report independent field failures together.");
    std::cout << cases.size() << " invalid-data fixtures rejected with expected field errors.\n";
}
void boundaries(const std::string& cats, const std::string& data) {
    const auto catalogue_result = parse_catalogues(cats);
    require(catalogue_result.ok(), "Baseline catalogues must validate.");
    const auto& catalogues = *catalogue_result.value;
    const Json baseline = Json::parse(data).at("profiles").at(0);
    for (int age : {18, 100}) {
        auto profile = baseline; profile["age"] = age;
        require(validate_profile(profile, catalogues).ok(), "Inclusive adult age boundary must pass.");
    }
    auto profile = baseline;
    profile["displayName"] = u8"\u00a0  Écho 🎓\u3000";
    profile["bio"] = " \tA short bio.\n ";
    auto valid = validate_profile(profile, catalogues);
    require(valid.ok() && valid.value->display_name == u8"Écho 🎓" && valid.value->bio == "A short bio.", "Trim Unicode whitespace without losing valid text.");
    for (const auto& unit : {std::string("x"), std::string(u8"é"), std::string(u8"🎓")}) {
        profile = baseline; profile["displayName"] = repeat(unit, 50);
        require(validate_profile(profile, catalogues).ok(), "50 code points must pass independent of byte length.");
        profile["displayName"] = repeat(unit, 51);
        require(error_at(validate_profile(profile, catalogues).errors, "/profile/displayName", "length"), "51 code points must fail.");
        profile = baseline; profile["bio"] = repeat(unit, 300);
        require(validate_profile(profile, catalogues).ok(), "300 bio code points must pass.");
        profile["bio"] = repeat(unit, 301);
        require(error_at(validate_profile(profile, catalogues).errors, "/profile/bio", "length"), "301 bio code points must fail.");
    }
    profile = baseline; profile["displayName"] = repeat(u8"e\u0301", 25);
    require(validate_profile(profile, catalogues).ok(), "25 decomposed accented letters equal 50 code points.");
    profile["displayName"] = repeat(u8"e\u0301", 26);
    require(!validate_profile(profile, catalogues).ok(), "No silent grapheme counting or Unicode normalisation.");
    for (const auto& bytes : {std::string("\xc0\xaf",2),std::string("\xed\xa0\x80",3),std::string("\xf4\x90\x80\x80",4),std::string("\xe2\x82",2),std::string("\x80",1)}) {
        profile = baseline; profile["displayName"] = bytes;
        require(error_at(validate_profile(profile, catalogues).errors, "/profile/displayName", "utf8"), "Reject malformed UTF-8, overlong sequences, surrogates and out-of-range scalars.");
        require(error_at(parse_dataset("{\"name\":\"" + bytes + "\"}", catalogues).errors, "/dataset", "json"), "Reject malformed UTF-8 at JSON import too.");
    }
    profile = baseline; profile["displayName"] = std::string("A\0B", 3);
    require(error_at(validate_profile(profile, catalogues).errors, "/profile/displayName", "control_character"), "Reject embedded NUL.");
    profile["displayName"] = "A\nB";
    require(!validate_profile(profile, catalogues).ok(), "Names cannot contain embedded line breaks.");
    profile = baseline; profile["bio"] = "Line one\nLine two\twith a tab.";
    require(validate_profile(profile, catalogues).ok(), "Bios may contain internal LF and tab.");
    profile = baseline; profile.erase("yearId");
    require(validate_profile(profile, catalogues).ok() && !validate_profile(profile, catalogues).value->year_id, "Omitted year is allowed.");
    profile["yearId"] = nullptr;
    require(validate_profile(profile, catalogues).ok(), "Null year is allowed.");
    profile["yearId"] = "";
    require(!validate_profile(profile, catalogues).ok(), "Use null or omit an optional year, not an empty ID.");
    profile = baseline; profile["showGender"] = false;
    valid = validate_profile(profile, catalogues);
    require(valid.ok() && !valid.value->show_gender && valid.value->gender_id == "woman", "Hiding gender must preserve the stored gender ID.");
    profile["id"] = visitor_id;
    require(validate_profile(profile, catalogues, ProfileKind::visitor).ok(), "Visitor role accepts only its reserved ID.");
    require(!validate_profile(profile, catalogues).ok(), "Fictional role rejects the visitor ID.");
    require(!validate_profile(baseline, catalogues, ProfileKind::visitor).ok(), "Visitor role rejects fictional IDs.");
    profile = baseline; profile["displayName"] = "Q"; profile["bio"] = "B"; profile["interestIds"] = Json::array({"coding"});
    require(validate_profile(profile, catalogues).ok(), "Minimum non-empty text and interest counts pass.");
}
}
int main(int argc, char** argv) {
    try {
        const auto cats = read("/data/catalogues.json");
        const auto data = read("/data/profiles.json");
        const std::string group = argc > 1 ? argv[1] : "all";
        if (group == "production" || group == "all") production(cats, data);
        if (group == "invalid" || group == "all") invalid_cases(cats, data);
        if (group == "boundaries" || group == "all") boundaries(cats, data);
        if (checks == 0) throw std::runtime_error("Unknown test group.");
        std::cout << "PASS: " << checks << " checks (" << group << ").\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "FAIL: " << error.what() << '\n';
        return 1;
    }
}
