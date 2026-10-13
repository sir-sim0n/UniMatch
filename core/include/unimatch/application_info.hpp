#pragma once

#include <string>

namespace unimatch {
// The Stage 1 read-only API. Core headers have no browser or Embind dependency.
std::string application_info_json();
}
