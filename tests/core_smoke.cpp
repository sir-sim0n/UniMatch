#include "unimatch/application_info.hpp"

#include <nlohmann/json.hpp>
#include <iostream>
#include <stdexcept>

int main() {
    try {
        const auto info = nlohmann::json::parse(unimatch::application_info_json());
        if (info.at("apiVersion") != 1 || info.at("application") != "UniMatch" ||
            !info.at("demoOnly").get<bool>() || !info.at("stage").is_number_integer() ||
            info.at("message").get<std::string>().empty()) {
            throw std::runtime_error("The bootstrap API contract is invalid.");
        }
        std::cout << "C++ core produces valid application metadata JSON.\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
