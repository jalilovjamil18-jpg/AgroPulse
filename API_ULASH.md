# AgroPulse Django REST API v1
Base URL: `http://127.0.0.1:8000/api/v1`

| Endpoint | Method | Token | Purpose |
|---|---|---|---|
| `/health/` | GET | no | Liveness |
| `/auth/login/` | POST | no | `{username,password}` => token + user |
| `/auth/logout/` | POST | yes | Token revoke |
| `/auth/me/` | GET | yes | Current role and district |
| `/dashboard/summary/` | GET | yes | Permission-scoped counters; latest actual reading |
| `/areas/` | GET | yes | Authorized areas |
| `/canals/` | GET | yes | Authorized canals |
| `/fields/` | GET | yes | Authorized fields |
| `/stations/` | GET | yes | Authorized stations |
| `/readings/` | GET | yes | Authorized measurements, most recent 200 |
| `/readings/` | POST | irrigation or superuser | Manual measurement `{station_id,recorded_at,flow_lps,level_cm?}` |
| `/alerts/` | GET | yes | Authorized issues |
| `/reports/readings.csv` | GET | yes | Authorized readings CSV max 10,000 |
| `/devices/ingest/` | POST | X-Device-Key | Device measurement, station-specific hashed token |

Auth: `Authorization: Token <token>`. RBAC enforced on backend querysets; frontend role choices **do not** grant access. No signup endpoint, only admin creates accounts. Roles: farmer, irrigation, authority, admin (superuser). No measurement data seeded automatically.

`flow_lps` is instantaneous liters per second. `level_cm` is centimeters. **Do not infer water volume (m³) without time-integration and verified sensor methodology.**

## v0.3: O‘lchov yangiligi / data quality

`GET /api/v1/dashboard/data-quality/` — Token-authenticated; returns only the logged-in user’s assigned canal/area/sensor scope. Response includes `counts.recent/stale/no_data/disabled`, `canals_without_area`, and list of sensor data status. `recent_threshold_hours = 48`. **This is observation freshness, not a device-online heartbeat**. `truncated=true` if over 500 stations in access scope.

Historical records and fields can be imported locally with the new Django management command, `import_pilot_data fields|readings <file.csv> [--apply]`. The command does *not* expose a public upload endpoint. Default mode always rolls back; invalid batches are atomic. Refer to `BOSQICH_3_REAL_PILOT.md`.
