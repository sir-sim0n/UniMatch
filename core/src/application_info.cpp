#include "unimatch/application_info.hpp"

#include <nlohmann/json.hpp>

namespace unimatch {
std::string application_info_json() {
    const nlohmann::json info = {
        {"apiVersion", 1},
        {"application", "UniMatch"},
        {"version", "0.7.0"},
        {"stage", 7},
        {"demoOnly", true},
        {"message", "UniMatch's C++ core is ready."}
    };
    return info.dump();
}
}


