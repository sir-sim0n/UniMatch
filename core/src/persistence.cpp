#include "unimatch/application.hpp"

#include <algorithm>
#include <unordered_set>

namespace unimatch {
namespace {
using Json = nlohmann::json;
Json nullable(const std::optional<std::string>& value) {
    return value ? Json(*value) : Json(nullptr);
}
ValidationResult<bool> invalid(const std::string& path, const std::string& code,
                               const std::string& message) {
    return {std::nullopt, {{path, code, message}}};
}
}

nlohmann::json Application::state_json() const {
    Json visitor = nullptr;
    if (state_.visitor) {
        const auto& p = *state_.visitor;
        visitor = {{"id",p.id},{"displayName",p.display_name},{"age",p.age},
            {"universityId",p.university_id},{"campusId",p.campus_id},{"degreeId",p.degree_id},
            {"yearId",nullable(p.year_id)},{"genderId",p.gender_id},{"showGender",p.show_gender},
            {"bio",p.bio},{"interestIds",p.interest_ids}};
    }
    const auto& p = state_.preferences;
    return {{"visitor",visitor},{"preferences",{{"minAge",p.min_age},{"maxAge",p.max_age},
        {"genderIds",p.gender_ids},{"universityId",nullable(p.university_id)},
        {"campusId",nullable(p.campus_id)},{"degreeId",nullable(p.degree_id)}}},
        {"savedIds",state_.saved_ids}};
}

std::string Application::export_state() const {
    auto document = state_json();
    document["schemaVersion"] = 1;
    return document.dump();
}

ValidationResult<bool> Application::import_state(std::string_view text) {
    // A normal state is a few KiB. Bound work before parsing untrusted browser data.
    if (text.size() > 65536)
        return invalid("/state", "size", "Saved demo exceeds the supported size.");
    Json document;
    try { document = Json::parse(text); }
    catch (const Json::exception&) {
        return invalid("/state", "json", "Saved demo is not valid JSON.");
    }
    if (!document.is_object() || document.size() != 4 || !document.contains("schemaVersion") ||
        !document.contains("visitor") || !document.contains("preferences") || !document.contains("savedIds"))
        return invalid("/state", "state_shape", "Saved demo has missing or unexpected fields.");
    if (!document["schemaVersion"].is_number_integer() || document["schemaVersion"] != 1)
        return invalid("/state/schemaVersion", "schema_version", "This saved demo version is not supported.");

    ApplicationState candidate;
    if (!document["visitor"].is_null()) {
        auto profile = validate_profile(document["visitor"], data_.catalogues,
                                        ProfileKind::visitor, "/state/visitor");
        if (!profile.ok()) return {std::nullopt, std::move(profile.errors)};
        candidate.visitor = std::move(*profile.value);
    }
    auto preferences = validate_preferences(document["preferences"], data_.catalogues);
    if (!preferences.ok()) {
        for (auto& issue : preferences.errors) issue.path = "/state" + issue.path;
        return {std::nullopt, std::move(preferences.errors)};
    }
    candidate.preferences = std::move(*preferences.value);
    const auto& ids = document["savedIds"];
    if (!ids.is_array() || ids.size() > data_.dataset.profiles.size())
        return invalid("/state/savedIds", "array", "Saved profiles must be a bounded list of fictional IDs.");
    std::unordered_set<std::string> seen;
    for (std::size_t i = 0; i < ids.size(); ++i) {
        const auto path = "/state/savedIds/" + std::to_string(i);
        if (!ids[i].is_string()) return invalid(path, "type", "Saved profile IDs must be strings.");
        const auto id = ids[i].get<std::string>();
        if (!find_profile(id))
            return invalid(path, "unknown_profile", "A saved fictional profile is no longer available.");
        if (!seen.insert(id).second)
            return invalid(path, "duplicate", "Saved profiles must not contain duplicates.");
        candidate.saved_ids.push_back(id);
    }
    if (!candidate.visitor) {
        const auto& p = candidate.preferences;
        if (!candidate.saved_ids.empty() || p.min_age != 18 || p.max_age != 100 ||
            !p.gender_ids.empty() || p.university_id || p.campus_id || p.degree_id)
            return invalid("/state", "profile_required", "A demo without a profile must have empty bookmarks and default preferences.");
    }
    // Commit only after the entire document is valid. Existing state survives every failure.
    state_ = std::move(candidate);
    return {true, {}};
}
}
