cmake_minimum_required(VERSION 3.31)
project(Orbit VERSION 1.8.1 LANGUAGES CXX)

if(CMAKE_SOURCE_DIR STREQUAL CMAKE_BINARY_DIR)
    message(FATAL_ERROR "Use a separate build directory: -B build/wasm")
endif()
if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "Activate Emscripten, then configure with: emcmake cmake --preset wasm-debug")
endif()
if(NOT EMSCRIPTEN_VERSION VERSION_EQUAL "4.0.15")
    message(FATAL_ERROR "This project is tested with Emscripten 4.0.15; activate that SDK version.")
endif()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)
set(JSON_BuildTests OFF CACHE BOOL "" FORCE)
set(JSON_Install OFF CACHE BOOL "" FORCE)
FetchContent_Declare(nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG 55f93686c01528224f448c19128836e7df245f72 # v3.12.0 release commit
    GIT_PROGRESS TRUE
)
FetchContent_MakeAvailable(nlohmann_json)

add_library(unimatch_core core/src/application_info.cpp core/src/data_validation.cpp core/src/application.cpp core/src/persistence.cpp)
target_include_directories(unimatch_core PUBLIC core/include)
target_link_libraries(unimatch_core PUBLIC nlohmann_json::nlohmann_json)
target_compile_options(unimatch_core PRIVATE -Wall -Wextra -Wpedantic)
# JSON parsing will need exceptions in both the core and its consumers.
target_compile_options(unimatch_core PUBLIC -fexceptions)
target_link_options(unimatch_core INTERFACE -sDISABLE_EXCEPTION_CATCHING=0)

set(UNIMATCH_SITE_DIR "${CMAKE_BINARY_DIR}/site")
add_executable(unimatch wasm/bindings.cpp)
target_link_libraries(unimatch PRIVATE unimatch_core)
target_compile_options(unimatch PRIVATE -Wall -Wextra -Wpedantic -Werror)
set_target_properties(unimatch PROPERTIES
    SUFFIX ".mjs"
    RUNTIME_OUTPUT_DIRECTORY "${UNIMATCH_SITE_DIR}/assets"
)
target_link_options(unimatch PRIVATE
    --bind
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sEXPORT_NAME=createUniMatch
    -sENVIRONMENT=web,node
    -sALLOW_MEMORY_GROWTH=1
)

# Run on every build so edits to web assets do not require a C++ recompile.
add_custom_target(website ALL
    COMMAND "${CMAKE_COMMAND}" -E make_directory "${UNIMATCH_SITE_DIR}/assets"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/index.html" "${UNIMATCH_SITE_DIR}/index.html"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/styles.css" "${UNIMATCH_SITE_DIR}/assets/styles.css"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/app.js" "${UNIMATCH_SITE_DIR}/assets/app.js"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/api-client.mjs" "${UNIMATCH_SITE_DIR}/assets/api-client.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/persistence.mjs" "${UNIMATCH_SITE_DIR}/assets/persistence.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/favicon.svg" "${UNIMATCH_SITE_DIR}/assets/favicon.svg"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/orbit-mark.svg" "${UNIMATCH_SITE_DIR}/assets/orbit-mark.svg"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/orbit-logo.svg" "${UNIMATCH_SITE_DIR}/assets/orbit-logo.svg"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/orbit-logo-stacked.svg" "${UNIMATCH_SITE_DIR}/assets/orbit-logo-stacked.svg"
    COMMAND "${CMAKE_COMMAND}" -E rm -f "${UNIMATCH_SITE_DIR}/assets/waves.svg"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/demo-accounts.mjs" "${UNIMATCH_SITE_DIR}/assets/demo-accounts.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/demo-social.mjs" "${UNIMATCH_SITE_DIR}/assets/demo-social.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/social-ui.mjs" "${UNIMATCH_SITE_DIR}/assets/social-ui.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/messages-ui.mjs" "${UNIMATCH_SITE_DIR}/assets/messages-ui.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/circles-core.mjs" "${UNIMATCH_SITE_DIR}/assets/circles-core.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/circles-ui.mjs" "${UNIMATCH_SITE_DIR}/assets/circles-ui.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/feed-core.mjs" "${UNIMATCH_SITE_DIR}/assets/feed-core.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/feed-ui.mjs" "${UNIMATCH_SITE_DIR}/assets/feed-ui.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/ui-icons.mjs" "${UNIMATCH_SITE_DIR}/assets/ui-icons.mjs"
    COMMAND "${CMAKE_COMMAND}" -E touch "${UNIMATCH_SITE_DIR}/.nojekyll"
    COMMAND "${CMAKE_COMMAND}" -E make_directory "${UNIMATCH_SITE_DIR}/data"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/data/catalogues.json" "${UNIMATCH_SITE_DIR}/data/catalogues.json"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/data/profiles.json" "${UNIMATCH_SITE_DIR}/data/profiles.json"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/engagement-core.mjs" "${UNIMATCH_SITE_DIR}/assets/engagement-core.mjs"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
        "${CMAKE_SOURCE_DIR}/web/discovery-core.mjs" "${UNIMATCH_SITE_DIR}/assets/discovery-core.mjs"
    DEPENDS unimatch
    VERBATIM
)

include(CTest)
if(BUILD_TESTING)
    find_program(UNIMATCH_NODE node REQUIRED)
    add_executable(core_smoke tests/core_smoke.cpp)
    target_link_libraries(core_smoke PRIVATE unimatch_core)
    target_link_options(core_smoke PRIVATE -sENVIRONMENT=node)
    add_test(NAME core_smoke COMMAND "${UNIMATCH_NODE}" "$<TARGET_FILE:core_smoke>")
    add_test(NAME bridge_smoke COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/bridge_smoke.mjs" "$<TARGET_FILE:unimatch>")
    add_test(NAME bridge_operations COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/bridge_operations.mjs" "$<TARGET_FILE:unimatch>"
        "${CMAKE_SOURCE_DIR}/data/catalogues.json" "${CMAKE_SOURCE_DIR}/data/profiles.json"
        "${CMAKE_SOURCE_DIR}/web/api-client.mjs")
    add_test(NAME persistence_integration COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/persistence_tests.mjs" "$<TARGET_FILE:unimatch>"
        "${CMAKE_SOURCE_DIR}/data/catalogues.json" "${CMAKE_SOURCE_DIR}/data/profiles.json"
        "${CMAKE_SOURCE_DIR}/web/api-client.mjs" "${CMAKE_SOURCE_DIR}/web/persistence.mjs")

    add_test(NAME demo_accounts COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/demo_accounts.mjs" "$<TARGET_FILE:unimatch>"
        "${CMAKE_SOURCE_DIR}/data/catalogues.json" "${CMAKE_SOURCE_DIR}/data/profiles.json"
        "${CMAKE_SOURCE_DIR}/web/api-client.mjs" "${CMAKE_SOURCE_DIR}/web/demo-accounts.mjs")
    add_test(NAME demo_social COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/demo_social.mjs" "${CMAKE_SOURCE_DIR}/web/demo-social.mjs")
    add_test(NAME demo_messages COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/demo_messages.mjs" "${CMAKE_SOURCE_DIR}/web/demo-social.mjs")
    add_test(NAME demo_circles COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/demo_circles.mjs" "${CMAKE_SOURCE_DIR}/web/demo-social.mjs")
    add_test(NAME public_feed COMMAND "${UNIMATCH_NODE}"
        "${CMAKE_SOURCE_DIR}/tests/public_feed.mjs" "${CMAKE_SOURCE_DIR}/web/demo-social.mjs")
    add_test(NAME engagement COMMAND "${UNIMATCH_NODE}" "${CMAKE_SOURCE_DIR}/tests/engagement.mjs")
    add_test(NAME discovery COMMAND "${UNIMATCH_NODE}" "${CMAKE_SOURCE_DIR}/tests/discovery.mjs")
    add_executable(data_tests tests/data_tests.cpp)
    target_link_libraries(data_tests PRIVATE unimatch_core)
    target_link_options(data_tests PRIVATE -sENVIRONMENT=node
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/data/catalogues.json@/data/catalogues.json\""
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/data/profiles.json@/data/profiles.json\""
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/tests/fixtures/invalid_data_cases.json@/fixtures/invalid_data_cases.json\""
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/tests/fixtures/malformed.json@/fixtures/malformed.json\"")
    # Relink the test when data changes, so the embedded fixture is never stale.
    set_property(TARGET data_tests APPEND PROPERTY LINK_DEPENDS
        "${CMAKE_SOURCE_DIR}/data/catalogues.json"
        "${CMAKE_SOURCE_DIR}/data/profiles.json"
        "${CMAKE_SOURCE_DIR}/tests/fixtures/invalid_data_cases.json"
        "${CMAKE_SOURCE_DIR}/tests/fixtures/malformed.json")
    foreach(group production invalid boundaries)
        add_test(NAME data_${group} COMMAND "${UNIMATCH_NODE}" "$<TARGET_FILE:data_tests>" "${group}")
    endforeach()
    add_executable(application_tests tests/application_tests.cpp)
    target_link_libraries(application_tests PRIVATE unimatch_core)
    target_compile_options(application_tests PRIVATE -Wall -Wextra -Wpedantic -Werror)
    target_link_options(application_tests PRIVATE -sENVIRONMENT=node
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/data/catalogues.json@/data/catalogues.json\""
        "SHELL:--embed-file \"${CMAKE_SOURCE_DIR}/data/profiles.json@/data/profiles.json\"")
    set_property(TARGET application_tests APPEND PROPERTY LINK_DEPENDS
        "${CMAKE_SOURCE_DIR}/data/catalogues.json" "${CMAKE_SOURCE_DIR}/data/profiles.json")
    foreach(group updates filters ranking bookmarks_reset)
        add_test(NAME app_${group} COMMAND "${UNIMATCH_NODE}" "$<TARGET_FILE:application_tests>" "${group}")
    endforeach()
endif()

