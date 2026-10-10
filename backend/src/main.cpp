#include "server.h"
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    int port = 8080;
    std::string dbPath = "platform.db";
    std::string schemaPath = "schema.sql";

    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--port" && i + 1 < argc) port = std::stoi(argv[++i]);
        if (arg == "--db" && i + 1 < argc) dbPath = argv[++i];
        if (arg == "--schema" && i + 1 < argc) schemaPath = argv[++i];
    }

    Database db(dbPath);
    if (!db.init(schemaPath)) {
        std::cerr << "Database init failed!" << std::endl;
        return 1;
    }
    std::cout << "Database initialized: " << dbPath << std::endl;

    HttpServer server(port, db);
    server.start();

    return 0;
}
