#pragma once

#include "unimatch/models.hpp"
#include <nlohmann/json.hpp>
#include <string_view>

namespace unimatch {
struct ValidationError {
    std::string path;
    std::string code;
    std::string message;
};
template<class T> struct ValidationResult {
    std::optional<T> value;
    std::vector<ValidationError> errors;
    bool ok() const { return value.has_value() && errors.empty(); }
};
enum class ProfileKind { fictional, visitor };
ValidationResult<Preferences> validate_preferences(const nlohmann::json& record, const Catalogues& catalogues);

// Failure returns errors only, never a partially accepted dataset.
ValidationResult<Catalogues> parse_catalogues(std::string_view document);
ValidationResult<Dataset> parse_dataset(std::string_view document, const Catalogues& catalogues);
ValidationResult<DataBundle> load_data(std::string_view catalogues, std::string_view profiles);
// Shared by dataset import and the future visitor profile editor.
ValidationResult<Profile> validate_profile(const nlohmann::json& record,
    const Catalogues& catalogues, ProfileKind kind = ProfileKind::fictional,
    const std::string& path = "/profile");
}
