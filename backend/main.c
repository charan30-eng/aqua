#include "aquabill.h"
#include "database.h"
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static volatile sig_atomic_t g_running = 1;

static void handle_signal(int sig) {
    (void)sig;
    g_running = 0;
}

int main(int argc, char **argv) {
    app_ctx_t ctx = {0};
    const char *port = AQUABILL_DEFAULT_PORT;
    safe_strncpy(ctx.db_path, AQUABILL_DEFAULT_DB, sizeof(ctx.db_path));
    safe_strncpy(ctx.web_root, AQUABILL_DEFAULT_WEBROOT, sizeof(ctx.web_root));
    bool seed_only = false;

    const char *env_port = getenv("AQUABILL_PORT");
    if (env_port && env_port[0] != '\0') port = env_port;
    const char *env_db = getenv("AQUABILL_DB");
    if (env_db && env_db[0] != '\0') safe_strncpy(ctx.db_path, env_db, sizeof(ctx.db_path));

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) {
            port = argv[++i];
        } else if (strcmp(argv[i], "--db") == 0 && i + 1 < argc) {
            safe_strncpy(ctx.db_path, argv[++i], sizeof(ctx.db_path));
        } else if (strcmp(argv[i], "--web-root") == 0 && i + 1 < argc) {
            safe_strncpy(ctx.web_root, argv[++i], sizeof(ctx.web_root));
        } else if (strcmp(argv[i], "--seed-only") == 0) {
            seed_only = true;
        }
    }

    snprintf(ctx.listen_addr, sizeof(ctx.listen_addr), "http://0.0.0.0:%s", port);

    if (!db_init(&ctx.db, ctx.db_path, "database/schema.sql")) {
        fprintf(stderr, "[AquaBill] Fatal: database initialization failed.\n");
        return 1;
    }
    if (!db_seed_if_empty(ctx.db)) {
        fprintf(stderr, "[AquaBill] Fatal: database seed failed.\n");
        db_close(ctx.db);
        return 1;
    }

    if (seed_only) {
        printf("[AquaBill] Database ready at %s\n", ctx.db_path);
        db_close(ctx.db);
        return 0;
    }

    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    struct mg_mgr mgr;
    mg_mgr_init(&mgr);
    if (mg_http_listen(&mgr, ctx.listen_addr, aquabill_http_handler, &ctx) == NULL) {
        fprintf(stderr, "[AquaBill] Fatal: failed to bind %s\n", ctx.listen_addr);
        mg_mgr_free(&mgr);
        db_close(ctx.db);
        return 1;
    }

    printf("============================================================\n");
    printf(" AquaBill Smart Water Billing Server v%s\n", AQUABILL_VERSION);
    printf(" Listening : %s\n", ctx.listen_addr);
    printf(" Database  : %s\n", ctx.db_path);
    printf(" Web Root  : %s\n", ctx.web_root);
    printf("============================================================\n");
    fflush(stdout);

    while (g_running) {
        mg_mgr_poll(&mgr, 250);
    }

    mg_mgr_free(&mgr);
    db_close(ctx.db);
    printf("[AquaBill] Server stopped cleanly.\n");
    return 0;
}
