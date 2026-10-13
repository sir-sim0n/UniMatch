#include "unimatch/data_validation.hpp"

#include <algorithm>
#include <cstdint>
#include <set>
#include <utility>

namespace unimatch {
namespace {
using Json = nlohmann::json;
using Errors = std::vector<ValidationError>;
void fail(Errors& errors, const std::string& path, const std::string& code, const std::string& message) {
    errors.push_back({path, code, message});
}
const Json& field(const Json& object, const std::string& name) {
    static const Json missing;
    if (!object.is_object()) return missing;
    const auto it = object.find(name);
    return it == object.end() ? missing : *it;
}
void keys(const Json& value, std::initializer_list<const char*> allowed, const std::string& path, Errors& errors) {
    if (!value.is_object()) { fail(errors, path, "type", "Expected a JSON object."); return; }
    for (auto it = value.begin(); it != value.end(); ++it) {
        if (std::none_of(allowed.begin(), allowed.end(), [&](const char* key) { return it.key() == key; }))
            fail(errors, path + "/" + it.key(), "unknown_field", "Unrecognised field.");
    }
}
bool whitespace(std::uint32_t cp) {
    return (cp >= 0x09 && cp <= 0x0d) || cp == 0x20 || cp == 0x85 || cp == 0xa0 ||
        cp == 0x1680 || (cp >= 0x2000 && cp <= 0x200a) || cp == 0x2028 ||
        cp == 0x2029 || cp == 0x202f || cp == 0x205f || cp == 0x3000;
}
struct Scalar { std::uint32_t value; std::size_t begin; std::size_t end; };
bool decode(const std::string& text, std::vector<Scalar>& result) {
    for (std::size_t i = 0; i < text.size();) {
        const auto begin = i;
        const auto lead = static_cast<unsigned char>(text[i++]);
        std::uint32_t cp = 0;
        std::size_t extra = 0;
        if (lead < 0x80) cp = lead;
        else if (lead >= 0xc2 && lead <= 0xdf) { cp = lead & 0x1f; extra = 1; }
        else if (lead >= 0xe0 && lead <= 0xef) { cp = lead & 0x0f; extra = 2; }
        else if (lead >= 0xf0 && lead <= 0xf4) { cp = lead & 0x07; extra = 3; }
        else return false;
        if (extra > text.size() - i) return false;
        for (std::size_t n = 0; n < extra; ++n) {
            const auto byte = static_cast<unsigned char>(text[i++]);
            if ((byte & 0xc0) != 0x80) return false;
            cp = (cp << 6) | (byte & 0x3f);
        }
        if ((extra == 1 && cp < 0x80) || (extra == 2 && cp < 0x800) ||
            (extra == 3 && cp < 0x10000) || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return false;
        result.push_back({cp, begin, i});
    }
    return true;
}
std::string text(const Json& value, const std::string& path, std::size_t limit, Errors& errors, bool multiline = false) {
    if (!value.is_string()) { fail(errors, path, "type", "A text value is required."); return {}; }
    const auto raw = value.get<std::string>();
    std::vector<Scalar> scalars;
    if (!decode(raw, scalars)) { fail(errors, path, "utf8", "Text must be valid UTF-8."); return {}; }
    std::size_t first = 0, last = scalars.size();
    while (first < last && whitespace(scalars[first].value)) ++first;
    while (last > first && whitespace(scalars[last - 1].value)) --last;
    if (first == last) { fail(errors, path, "required", "This field cannot be blank."); return {}; }
    if (last - first > limit) fail(errors, path, "length", "Text exceeds the Unicode code-point limit of " + std::to_string(limit) + ".");
    for (auto i = first; i < last; ++i) {
        const auto cp = scalars[i].value;
        if ((cp < 0x20 || (cp >= 0x7f && cp <= 0x9f)) && !(multiline && (cp == 9 || cp == 10))) {
            fail(errors, path, "control_character", "Text contains an unsupported control character."); break;
        }
    }
    return raw.substr(scalars[first].begin, scalars[last - 1].end - scalars[first].begin);
}
bool stable_id(const std::string& id) {
    return !id.empty() && id.size() <= 64 && id[0] >= 'a' && id[0] <= 'z' &&
        std::all_of(id.begin(), id.end(), [](char c) {
            return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_' || c == '-';
        });
}
std::string id_field(const Json& value, const std::string& path, Errors& errors) {
    if (!value.is_string()) { fail(errors, path, "type", "A stable ID string is required."); return {}; }
    const auto id = value.get<std::string>();
    if (!stable_id(id)) fail(errors, path, "id", "Use 1–64 lowercase ASCII letters, digits, underscores or hyphens, starting with a letter.");
    return id;
}
bool integer(const Json& value, int low, int high, const std::string& path, Errors& errors, int& output) {
    if (!value.is_number_integer()) { fail(errors, path, "integer", "An integer is required."); return false; }
    // Compare before conversion so huge unsigned JSON integers cannot wrap.
    const bool valid = value.is_number_unsigned()
        ? value.get<std::uint64_t>() <= static_cast<std::uint64_t>(high) && value.get<std::uint64_t>() >= static_cast<std::uint64_t>(low)
        : value.get<std::int64_t>() >= low && value.get<std::int64_t>() <= high;
    if (!valid) { fail(errors, path, "range", "Value must be from " + std::to_string(low) + " to " + std::to_string(high) + "."); return false; }
    output = value.get<int>();
    return true;
}
void version(const Json& root, const std::string& path, Errors& errors) {
    int schema = 0;
    integer(field(root, "schemaVersion"), data_schema_version, data_schema_version, path + "/schemaVersion", errors, schema);
}
bool has_choice(const std::vector<Choice>& choices, const std::string& id) {
    return std::any_of(choices.begin(), choices.end(), [&](const Choice& item) { return item.id == id; });
}
std::string reference(const Json& object, const std::string& name, const std::vector<Choice>& choices,
    const std::string& path, Errors& errors) {
    const auto id = id_field(field(object, name), path + "/" + name, errors);
    if (!id.empty() && !has_choice(choices, id)) fail(errors, path + "/" + name, "reference", "Choose an existing catalogue item.");
    return id;
}
std::vector<Choice> choices(const Json& value, const std::string& path, Errors& errors) {
    std::vector<Choice> result;
    if (!value.is_array() || value.empty()) { fail(errors, path, "array", "A non-empty list of choices is required."); return result; }
    std::set<std::string> ids;
    for (std::size_t i = 0; i < value.size(); ++i) {
        const auto p = path + "/" + std::to_string(i);
        keys(value[i], {"id", "label"}, p, errors);
        Choice choice{id_field(field(value[i], "id"), p + "/id", errors), text(field(value[i], "label"), p + "/label", 100, errors)};
        if (!ids.insert(choice.id).second) fail(errors, p + "/id", "duplicate", "Catalogue IDs must be unique within their list.");
        result.push_back(std::move(choice));
    }
    return result;
}
std::optional<Json> parse(std::string_view document, const std::string& path, Errors& errors) {
    try { return Json::parse(document.begin(), document.end()); }
    catch (const Json::exception&) { fail(errors, path, "json", "Malformed JSON or invalid Unicode encoding."); return std::nullopt; }
}
}

ValidationResult<Catalogues> parse_catalogues(std::string_view document) {
    ValidationResult<Catalogues> result;
    const auto root = parse(document, "/catalogues", result.errors);
    if (!root) return result;
    auto& errors = result.errors;
    keys(*root, {"schemaVersion", "universities", "degrees", "interests", "genders", "years"}, "/catalogues", errors);
    version(*root, "/catalogues", errors);
    Catalogues catalogues;
    const auto& universities = field(*root, "universities");
    std::set<std::string> university_ids, campus_ids;
    if (!universities.is_array() || universities.empty()) fail(errors, "/catalogues/universities", "array", "A non-empty university list is required.");
    else for (std::size_t i = 0; i < universities.size(); ++i) {
        const auto p = "/catalogues/universities/" + std::to_string(i);
        const auto& item = universities[i];
        keys(item, {"id", "label", "campuses"}, p, errors);
        University university{id_field(field(item, "id"), p + "/id", errors), text(field(item, "label"), p + "/label", 100, errors),
            choices(field(item, "campuses"), p + "/campuses", errors)};
        if (!university_ids.insert(university.id).second) fail(errors, p + "/id", "duplicate", "University IDs must be unique.");
        for (std::size_t c = 0; c < university.campuses.size(); ++c)
            if (!campus_ids.insert(university.campuses[c].id).second)
                fail(errors, p + "/campuses/" + std::to_string(c) + "/id", "duplicate", "Campus IDs must be globally unique.");
        catalogues.universities.push_back(std::move(university));
    }
    catalogues.degrees = choices(field(*root, "degrees"), "/catalogues/degrees", errors);
    catalogues.interests = choices(field(*root, "interests"), "/catalogues/interests", errors);
    catalogues.genders = choices(field(*root, "genders"), "/catalogues/genders", errors);
    catalogues.years = choices(field(*root, "years"), "/catalogues/years", errors);
    if (errors.empty()) result.value = std::move(catalogues);
    return result;
}

ValidationResult<Profile> validate_profile(const Json& record, const Catalogues& catalogues, ProfileKind kind, const std::string& path) {
    ValidationResult<Profile> result;
    auto& errors = result.errors;
    keys(record, {"id", "displayName", "age", "universityId", "campusId", "degreeId", "yearId", "genderId", "showGender", "bio", "interestIds"}, path, errors);
    if (!record.is_object()) return result;
    Profile profile;
    const auto& raw_id = field(record, "id");
    if (kind == ProfileKind::visitor) {
        if (!raw_id.is_string() || raw_id.get<std::string>() != visitor_id)
            fail(errors, path + "/id", "reserved_id", "The visitor profile must use visitor:local.");
        profile.id = visitor_id;
    } else {
        profile.id = id_field(raw_id, path + "/id", errors);
        if (profile.id == visitor_id) fail(errors, path + "/id", "reserved_id", "The visitor ID cannot be used by fictional profiles.");
    }
    profile.display_name = text(field(record, "displayName"), path + "/displayName", 50, errors);
    integer(field(record, "age"), 18, 100, path + "/age", errors, profile.age);
    profile.university_id = id_field(field(record, "universityId"), path + "/universityId", errors);
    profile.campus_id = id_field(field(record, "campusId"), path + "/campusId", errors);
    const auto university = std::find_if(catalogues.universities.begin(), catalogues.universities.end(),
        [&](const University& item) { return item.id == profile.university_id; });
    if (university == catalogues.universities.end()) fail(errors, path + "/universityId", "reference", "Choose an existing university.");
    else if (!has_choice(university->campuses, profile.campus_id)) fail(errors, path + "/campusId", "campus", "Choose a campus belonging to the selected university.");
    profile.degree_id = reference(record, "degreeId", catalogues.degrees, path, errors);
    if (record.contains("yearId") && !record["yearId"].is_null()) profile.year_id = reference(record, "yearId", catalogues.years, path, errors);
    profile.gender_id = reference(record, "genderId", catalogues.genders, path, errors);
    if (!field(record, "showGender").is_boolean()) fail(errors, path + "/showGender", "boolean", "Gender visibility must be true or false.");
    else profile.show_gender = record["showGender"].get<bool>();
    profile.bio = text(field(record, "bio"), path + "/bio", 300, errors, true);
    const auto& interests = field(record, "interestIds");
    if (!interests.is_array()) fail(errors, path + "/interestIds", "array", "Select a list of interests.");
    else {
        if (interests.empty() || interests.size() > 5) fail(errors, path + "/interestIds", "interest_count", "Select 1–5 unique interests.");
        std::set<std::string> seen;
        for (std::size_t i = 0; i < interests.size(); ++i) {
            const auto p = path + "/interestIds/" + std::to_string(i);
            const auto id = id_field(interests[i], p, errors);
            if (!has_choice(catalogues.interests, id)) fail(errors, p, "reference", "Choose an existing interest.");
            if (!seen.insert(id).second) fail(errors, p, "duplicate", "Select each interest only once.");
            profile.interest_ids.push_back(id);
        }
    }
    if (errors.empty()) result.value = std::move(profile);
    return result;
}

ValidationResult<Dataset> parse_dataset(std::string_view document, const Catalogues& catalogues) {
    ValidationResult<Dataset> result;
    const auto root = parse(document, "/dataset", result.errors);
    if (!root) return result;
    auto& errors = result.errors;
    keys(*root, {"schemaVersion", "fictional", "notice", "profiles"}, "/dataset", errors);
    version(*root, "/dataset", errors);
    if (!field(*root, "fictional").is_boolean() || field(*root, "fictional") != true)
        fail(errors, "/dataset/fictional", "fictional", "The demo dataset must be marked fictional: true.");
    Dataset dataset;
    dataset.notice = text(field(*root, "notice"), "/dataset/notice", 500, errors);
    const auto& profiles = field(*root, "profiles");
    if (!profiles.is_array() || profiles.empty()) fail(errors, "/dataset/profiles", "array", "A non-empty profile list is required.");
    else {
        std::set<std::string> seen;
        for (std::size_t i = 0; i < profiles.size(); ++i) {
            const auto p = "/dataset/profiles/" + std::to_string(i);
            auto parsed = validate_profile(profiles[i], catalogues, ProfileKind::fictional, p);
            const auto& raw_id = field(profiles[i], "id");
            if (raw_id.is_string() && !seen.insert(raw_id.get<std::string>()).second)
                fail(errors, p + "/id", "duplicate", "Profile IDs must be unique; display names may repeat.");
            errors.insert(errors.end(), parsed.errors.begin(), parsed.errors.end());
            if (parsed.ok()) dataset.profiles.push_back(std::move(*parsed.value));
        }
    }
    if (errors.empty()) result.value = std::move(dataset);
    return result;
}

ValidationResult<Preferences> validate_preferences(const Json& record, const Catalogues& catalogues) {
    ValidationResult<Preferences> result;
    auto& errors = result.errors;
    const std::string path = "/preferences";
    keys(record, {"minAge", "maxAge", "genderIds", "universityId", "campusId", "degreeId"}, path, errors);
    if (!record.is_object()) return result;
    Preferences prefs;
    const bool min_ok = integer(field(record, "minAge"), 18, 100, path + "/minAge", errors, prefs.min_age);
    const bool max_ok = integer(field(record, "maxAge"), 18, 100, path + "/maxAge", errors, prefs.max_age);
    if (min_ok && max_ok && prefs.min_age > prefs.max_age)
        fail(errors, path + "/maxAge", "age_order", "Maximum age must be at least the minimum age.");
    const auto& genders = field(record, "genderIds");
    if (!genders.is_array()) fail(errors, path + "/genderIds", "array", "Select a list of genders; an empty list means Any gender.");
    else {
        std::set<std::string> seen;
        for (std::size_t i = 0; i < genders.size(); ++i) {
            const auto p = path + "/genderIds/" + std::to_string(i);
            const auto id = id_field(genders[i], p, errors);
            if (!has_choice(catalogues.genders, id)) fail(errors, p, "reference", "Choose an existing gender.");
            if (!seen.insert(id).second) fail(errors, p, "duplicate", "Select each gender only once.");
            prefs.gender_ids.push_back(id);
        }
    }
    const University* university = nullptr;
    if (!field(record, "universityId").is_null()) {
        prefs.university_id = id_field(record["universityId"], path + "/universityId", errors);
        for (const auto& item : catalogues.universities) if (item.id == prefs.university_id) university = &item;
        if (!university) fail(errors, path + "/universityId", "reference", "Choose an existing university.");
    }
    if (!field(record, "campusId").is_null()) {
        prefs.campus_id = id_field(record["campusId"], path + "/campusId", errors);
        if (!university || !has_choice(university->campuses, *prefs.campus_id))
            fail(errors, path + "/campusId", "campus", "Select a university and one of its campuses, or use Any campus.");
    }
    if (!field(record, "degreeId").is_null()) prefs.degree_id = reference(record, "degreeId", catalogues.degrees, path, errors);
    if (errors.empty()) result.value = std::move(prefs);
    return result;
}

ValidationResult<DataBundle> load_data(std::string_view catalogues, std::string_view profiles) {
    ValidationResult<DataBundle> result;
    auto cats = parse_catalogues(catalogues);
    if (!cats.ok()) { result.errors = std::move(cats.errors); return result; }
    auto data = parse_dataset(profiles, *cats.value);
    if (!data.ok()) { result.errors = std::move(data.errors); return result; }
    result.value = DataBundle{std::move(*cats.value), std::move(*data.value)};
    return result;
}
}
