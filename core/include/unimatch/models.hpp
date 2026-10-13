#pragma once

#include <optional>
#include <string>
#include <vector>

namespace unimatch {
inline constexpr const char* visitor_id = "visitor:local";
inline constexpr int data_schema_version = 1;

struct Choice { std::string id; std::string label; };
struct University {
    std::string id;
    std::string label;
    std::vector<Choice> campuses;
};
struct Catalogues {
    std::vector<University> universities;
    std::vector<Choice> degrees;
    std::vector<Choice> interests;
    std::vector<Choice> genders;
    std::vector<Choice> years;
};
struct Profile {
    std::string id;
    std::string display_name;
    int age = 18;
    std::string university_id;
    std::string campus_id;
    std::string degree_id;
    std::optional<std::string> year_id;
    std::string gender_id;
    bool show_gender = false;
    std::string bio;
    std::vector<std::string> interest_ids;
};
struct Preferences {
    int min_age = 18;
    int max_age = 100;
    // Empty means Any gender; visibility never changes the stored gender ID.
    std::vector<std::string> gender_ids;
    // nullopt means Any; Stage 3 will default these to the visitor's selections.
    std::optional<std::string> university_id;
    std::optional<std::string> campus_id;
    std::optional<std::string> degree_id;
};
struct ApplicationState {
    std::optional<Profile> visitor;
    Preferences preferences;
    std::vector<std::string> saved_ids;
};
struct Dataset {
    int schema_version = data_schema_version;
    std::string notice;
    std::vector<Profile> profiles;
};
struct DataBundle { Catalogues catalogues; Dataset dataset; };
}
