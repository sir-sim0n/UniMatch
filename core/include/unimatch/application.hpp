#pragma once

#include "unimatch/data_validation.hpp"
#include <utility>

namespace unimatch {
// A discovery/detail view omits private gender values instead of exposing raw Profile.
struct ProfileView {
    std::string id;
    std::string display_name;
    int age;
    std::string university_id;
    std::string campus_id;
    std::string degree_id;
    std::optional<std::string> year_id;
    std::optional<std::string> visible_gender_id;
    std::string bio;
    std::vector<std::string> interest_ids;
    std::vector<std::string> shared_interest_ids;
    std::string explanation;
    bool saved;
};

class Application {
public:
    // The only constructor entry point validates all source data first.
    static ValidationResult<Application> create(std::string_view catalogues, std::string_view profiles);
    const Catalogues& catalogues() const { return data_.catalogues; }
    const ApplicationState& state() const { return state_; }
    ValidationResult<bool> update_profile(const nlohmann::json& profile);
    ValidationResult<bool> update_preferences(const nlohmann::json& preferences);
    ValidationResult<std::vector<ProfileView>> discover() const;
    ValidationResult<ProfileView> view_profile(const std::string& id) const;
    ValidationResult<std::vector<ProfileView>> saved_profiles() const;
    ValidationResult<bool> save(const std::string& id);
    ValidationResult<bool> unsave(const std::string& id);
    ValidationResult<bool> reset(bool confirmed);
    nlohmann::json state_json() const;
    std::string export_state() const;
    ValidationResult<bool> import_state(std::string_view document);

private:
    explicit Application(DataBundle data) : data_(std::move(data)) {}
    const Profile* find_profile(const std::string& id) const;
    ProfileView make_view(const Profile& profile) const;
    bool eligible(const Profile& profile) const;
    DataBundle data_; // Never mutated after validated construction.
    ApplicationState state_;
};
}
