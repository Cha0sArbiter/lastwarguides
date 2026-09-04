# Image Research Manifest Schema

This schema defines the Markdown format used by the Guidebook 2.0 image-research manifests.

The manifests are a navigational research index. They link to externally hosted guide images, charts, maps, spreadsheets, planners, and image-heavy pages. They do not store image binaries.

## Resource entry

Use one `###` heading per distinct resource.

```md
### Resource title
- **Creator:** Creator name or best-known attribution
- **Source:** https://specific-resource-or-page.example
- **Direct image:** https://direct-image.example/image.png
- **Language:** English
- **Era:** Season 2
- **Published:** August 15, 2025
- **Also:** https://alternate-or-related-source.example
- **Contains:** Short description of the useful information in the resource.
- **Notes:** Optional research/navigation note.
```

### Required fields

- **Creator:** The original creator when known. If unknown, use the best available attribution such as `Reddit community`, `Unknown / Discord community`, or the publishing site.
- **Source:** The most specific useful navigation target available. Prefer the individual post, document, spreadsheet, image, guide page, or planner over a directory or collection page.
- **Contains:** A concise description of what useful data or visual material the resource contains.

### Optional fields

Include these only when useful and known:

- **Direct image:** Stable direct URL to the image itself.
- **Language:** Omit for English. Include for non-English or multilingual sources.
- **Era:** Relevant season, server era, or progression period.
- **Published:** Publication date when known and useful for version awareness.
- **Also:** Additional version, mirror, corrected post, export, PDF, or closely related target. Repeat this field when multiple alternates are useful.
- **Notes:** Navigation, versioning, correction, or provenance details that do not belong in `Contains`.

## Normalization rules

1. **Source must navigate to the item.** Do not use a generic collection page as an item-level `Source` when a specific post, spreadsheet, direct image, or guide page is available.
2. **Direct-image-only resources use the image as Source.** If no better parent page is known, set both `Source` and `Direct image` to the direct image URL.
3. **Collection pages belong in `source-hubs.md`.** Do not repeat a broad source hub as the `Source` of an individual entry unless no specific item target can be resolved.
4. **One resource, one entry.** Closely related mirrors or corrected versions belong under `Also` or `Notes` rather than as duplicate entries unless they contain materially different information.
5. **Keep descriptions factual.** `Contains` describes what is present, not whether the data is verified or recommended.
6. **Use consistent names.** Prefer the creator's or source's established title; otherwise use a concise descriptive title.
7. **Do not add empty fields.** Optional fields are omitted rather than left blank.
8. **Topic manifests own the resources.** Each resource should live in the most relevant topic manifest. Cross-topic discovery should be handled from the root `manifest.md`, not by duplicating the full entry.

## Source hub entry

Broad visual libraries and community collections use a shorter format in `source-hubs.md`:

```md
### Source hub name
- **Source:** https://collection.example
- **Creator:** Creator or community, when useful
- **Language:** Japanese
- **Contains:** Short description of the collection and the topics it covers.
```

`Source` and `Contains` are required for source hubs. `Creator` and `Language` are optional.
