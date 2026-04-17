# ClearDay Mobile Release Hardening Checklist

## Build and Versioning
- Keep `expo.version` in sync with release notes.
- Increment `ios.buildNumber` and `android.versionCode` for every store upload.
- Validate EAS profiles before cut: `development`, `preview`, and `production`.

## Store Metadata
- Finalize app name/subtitle and category in App Store Connect / Play Console.
- Prepare privacy policy URL and support URL.
- Confirm age/content rating questionnaire responses.

## Privacy and Permissions
- Keep runtime permissions minimal; add only if feature needs it.
- Document what data stays local vs. leaves device.
- All data is local (AsyncStorage). No network calls from app code.

## QA Gates
- iOS + Android smoke pass: launch, add/drag move, MIT edit, vault/restore.
- Persistence test across cold restart.
- Migration test from legacy `@maxmonk_tasks` / SQLite `tasks` data.
- Regression: on-hold opacity and quadrant reassignment behavior.

## Submission Prep
- Capture screenshots for required device sizes.
- Add app icon and splash review pass for visual QA.
- Run final build command: `eas build --platform all --profile production`.
