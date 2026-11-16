#ifndef AQUABILL_DATABASE_H
#define AQUABILL_DATABASE_H

#include <stdbool.h>
#include <sqlite3.h>

/* Opens SQLite DB, configures PRAGMAs, applies schema only if uninitialized. */
bool db_init(sqlite3 **db_out, const char *db_path, const char *schema_path);

/* Idempotently seeds realistic data ONLY if users table is empty. */
bool db_seed_if_empty(sqlite3 *db);

/* Marks unpaid bills whose due_date < today as overdue. */
void db_refresh_overdue_bills(sqlite3 *db);

void db_close(sqlite3 *db);

#endif
