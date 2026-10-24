#include "unimatch/application_info.hpp"

#include <nlohmann/json.hpp>

namespace unimatch {
std::string application_info_json() {
    const nlohmann::json info = {
        {"apiVersion", 1},
        {"application", "Orbit"},
        {"version", "1.7.0"},
        {"stage", 7},
        {"demoOnly", true},
        {"message", "Orbit's C++ core is ready."}
    };
    return info.dump();
}
}


