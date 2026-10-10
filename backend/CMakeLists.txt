cmake_minimum_required(VERSION 3.10)
project(WeekendPartTimePlatform CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SQLite3 QUIET)
if(NOT SQLite3_FOUND)
    # 手动查找
    find_path(SQLITE3_INCLUDE_DIR sqlite3.h)
    find_library(SQLITE3_LIBRARY sqlite3)
    if(SQLITE3_INCLUDE_DIR AND SQLITE3_LIBRARY)
        set(SQLITE3_FOUND TRUE)
    endif()
endif()

if(NOT SQLITE3_FOUND)
    message(WARNING "SQLite3 not found. Please install: Ubuntu: apt install libsqlite3-dev | Windows: vcpkg install sqlite3")
endif()

include_directories(${SQLITE3_INCLUDE_DIR})

add_executable(platform_server
    src/main.cpp
    src/server.cpp
    src/database.cpp
    src/agent.cpp
)

target_link_libraries(platform_server ${SQLITE3_LIBRARY})

if(MSVC)
    target_compile_options(platform_server PRIVATE /W3)
else()
    target_compile_options(platform_server PRIVATE -Wall -Wextra)
endif()

# Windows 需要链接 ws2_32
if(WIN32)
    target_link_libraries(platform_server ws2_32)
endif()
