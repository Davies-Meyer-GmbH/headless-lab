# Editing Canvas component props

For an optional text prop such as subHeading11:

1. Add its schema to props.properties in component.yml, using a camelCase machine name and matching readable title. The current files use JSON-style YAML, so commas between properties are required.
2. Receive and render the prop in index.jsx. Schema alone creates no visible frontend markup.
3. Keep npm run dev running. The withCanvas integration watches component definitions.
4. Reload Canvas to synchronize component metadata. Wait for the frontend synchronization indicator to finish.
5. If the selected instance still shows the old fields, reload Canvas again or reopen the page. The layout can have loaded before metadata synchronization completed.
6. Enter the content and review/publish normally. Export Drupal configuration when preparing the change for another environment.

Canvas stores versions of component definitions. For compatible changes, ApiLayoutController::buildRegion() calls ComponentSourceManager::updateComponentInstances() when loading the layout and autosaves the upgraded draft. A manual PHP migration is not normally needed for an optional text addition. Renames, removals, required fields, and type changes need separate compatibility/data-migration assessment.

A component prop is per-instance Canvas input. It does not create a field on Product nodes. Shared Product data requires Drupal field configuration.

## Verified subHeading11 example, 15 October 2026

Drupal had registered subHeading11 in active Hero version 6ac6b5314011c35e, while saved and draft instances initially referenced c4ee51a89f5456e8. A fresh Canvas layout load upgraded the draft automatically, and the Sub heading 11 input appeared. Published content stayed on the old version, the unpublished slider count stayed 4 versus published 6, and no draft conflict was present.

An attempted broader published/draft migration stopped during validation. Automatic review rejected a proposed timestamp adjustment; it was not executed. The task was resolved through the native Canvas layout-upgrade flow instead, and the unnecessary migration script was removed.
