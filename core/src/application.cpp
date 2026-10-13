#include "unimatch/application.hpp"

#include <algorithm>
#include <utility>

namespace unimatch {
namespace {
template<class T> ValidationResult<T> error(const std::string& path, const std::string& code, const std::string& message) {
    return {std::nullopt, {{path, code, message}}};
}
template<class T> ValidationResult<T> success(T value) { return {std::move(value), {}}; }
bool contains(const std::vector<std::string>& values, const std::string& value) {
    return std::find(values.begin(), values.end(), value) != values.end();
}
// Unsigned UTF-8 byte order is deterministic across locales and char signedness.
bool text_less(const std::string& a, const std::string& b) {
    return std::lexicographical_compare(a.begin(), a.end(), b.begin(), b.end(),
        [](unsigned char x, unsigned char y) { return x < y; });
}
std::string explain(const std::vector<std::string>& labels) {
    if (labels.empty()) return "No shared interests selected.";
    std::string result = "You both selected ";
    for (std::size_t i = 0; i < labels.size(); ++i) {
        if (i > 0) result += (i + 1 == labels.size() ? (labels.size() == 2 ? " and " : ", and ") : ", ");
        result += labels[i];
    }
    return result + ".";
}
}

ValidationResult<Application> Application::create(std::string_view catalogues, std::string_view profiles) {
    auto data = load_data(catalogues, profiles);
    if (!data.ok()) return {std::nullopt, std::move(data.errors)};
    return success(Application(std::move(*data.value)));
}
ValidationResult<bool> Application::update_profile(const nlohmann::json& record) {
    auto profile = validate_profile(record, data_.catalogues, ProfileKind::visitor);
    if (!profile.ok()) return {std::nullopt, std::move(profile.errors)};
    if (!state_.visitor) {
        state_.preferences = Preferences{};
        state_.preferences.university_id = profile.value->university_id;
        state_.preferences.campus_id = profile.value->campus_id;
    }
    state_.visitor = std::move(*profile.value);
    return success(true);
}
ValidationResult<bool> Application::update_preferences(const nlohmann::json& record) {
    if (!state_.visitor) return error<bool>("/visitor", "profile_required", "Create a demo profile first.");
    auto preferences = validate_preferences(record, data_.catalogues);
    if (!preferences.ok()) return {std::nullopt, std::move(preferences.errors)};
    state_.preferences = std::move(*preferences.value);
    return success(true);
}
const Profile* Application::find_profile(const std::string& id) const {
    if (id == visitor_id) return nullptr;
    const auto it = std::find_if(data_.dataset.profiles.begin(), data_.dataset.profiles.end(),
        [&](const Profile& p) { return p.id == id; });
    return it == data_.dataset.profiles.end() ? nullptr : &*it;
}
bool Application::eligible(const Profile& profile) const {
    const auto& prefs = state_.preferences;
    return profile.id != visitor_id && profile.age >= prefs.min_age && profile.age <= prefs.max_age &&
        (prefs.gender_ids.empty() || contains(prefs.gender_ids, profile.gender_id)) &&
        (!prefs.university_id || profile.university_id == *prefs.university_id) &&
        (!prefs.campus_id || profile.campus_id == *prefs.campus_id) &&
        (!prefs.degree_id || profile.degree_id == *prefs.degree_id);
}
ProfileView Application::make_view(const Profile& profile) const {
    ProfileView view{profile.id, profile.display_name, profile.age, profile.university_id,
        profile.campus_id, profile.degree_id, profile.year_id,
        profile.show_gender ? std::optional<std::string>(profile.gender_id) : std::nullopt,
        profile.bio, profile.interest_ids, {}, {}, contains(state_.saved_ids, profile.id)};
    std::vector<std::string> labels;
    // Catalogue order makes explanations independent of selection order.
    for (const auto& interest : data_.catalogues.interests) {
        if (contains(state_.visitor->interest_ids, interest.id) && contains(profile.interest_ids, interest.id)) {
            view.shared_interest_ids.push_back(interest.id);
            labels.push_back(interest.label);
        }
    }
    view.explanation = explain(labels);
    return view;
}
ValidationResult<std::vector<ProfileView>> Application::discover() const {
    if (!state_.visitor) return error<std::vector<ProfileView>>("/visitor", "profile_required", "Create a demo profile first.");
    std::vector<ProfileView> result;
    for (const auto& profile : data_.dataset.profiles) if (eligible(profile)) result.push_back(make_view(profile));
    std::sort(result.begin(), result.end(), [](const ProfileView& a, const ProfileView& b) {
        if (a.shared_interest_ids.size() != b.shared_interest_ids.size()) return a.shared_interest_ids.size() > b.shared_interest_ids.size();
        if (a.display_name != b.display_name) return text_less(a.display_name, b.display_name);
        return text_less(a.id, b.id);
    });
    return success(std::move(result));
}
ValidationResult<ProfileView> Application::view_profile(const std::string& id) const {
    if (!state_.visitor) return error<ProfileView>("/visitor", "profile_required", "Create a demo profile first.");
    const auto* profile = find_profile(id);
    if (!profile) return error<ProfileView>("/id", "unknown_profile", "This fictional profile does not exist.");
    return success(make_view(*profile));
}
ValidationResult<std::vector<ProfileView>> Application::saved_profiles() const {
    if (!state_.visitor) return error<std::vector<ProfileView>>("/visitor", "profile_required", "Create a demo profile first.");
    std::vector<ProfileView> result;
    for (const auto& id : state_.saved_ids) {
        const auto* profile = find_profile(id);
        if (profile) result.push_back(make_view(*profile));
    }
    return success(std::move(result));
}
ValidationResult<bool> Application::save(const std::string& id) {
    if (!state_.visitor) return error<bool>("/visitor", "profile_required", "Create a demo profile first.");
    if (!find_profile(id)) return error<bool>("/id", "unknown_profile", "Only existing fictional profiles can be saved.");
    if (contains(state_.saved_ids, id)) return success(false);
    state_.saved_ids.push_back(id);
    return success(true);
}
ValidationResult<bool> Application::unsave(const std::string& id) {
    if (!state_.visitor) return error<bool>("/visitor", "profile_required", "Create a demo profile first.");
    if (!find_profile(id)) return error<bool>("/id", "unknown_profile", "This fictional profile does not exist.");
    const auto it = std::find(state_.saved_ids.begin(), state_.saved_ids.end(), id);
    if (it == state_.saved_ids.end()) return success(false);
    state_.saved_ids.erase(it);
    return success(true);
}
ValidationResult<bool> Application::reset(bool confirmed) {
    if (!confirmed) return error<bool>("/confirmed", "confirmation_required", "Confirm before resetting your demo.");
    state_ = ApplicationState{};
    return success(true);
}
}
