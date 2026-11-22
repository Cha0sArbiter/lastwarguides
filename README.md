# Last War Guidebook 2.0

A mobile-friendly index of alliance guides, community visuals, and planning tools for Last War: Survival. The first release includes Alliance Duel, Arms Race, and Gold Zombies.

## Build locally

Use Node.js 24 or newer.

```sh
npm ci
npm run build
```

Serve the generated `dist/` directory with a static HTTP server. The site also works under a repository path such as `/lastwarguides/`.

## Edit content

- Edit `armsrace.md` or `goldzombies.md` to update the full guides.
- Add and update external resources in [`research/guide-images/manifests/`](research/guide-images/manifests/) using the [manifest schema](research/guide-images/schema.md). The build reads these entries into the homepage catalog.
- Update the featured resources and quick tips in [`scripts/build.mjs`](scripts/build.mjs).

Image URLs point to the original providers. The catalog also includes links to the source pages.

## GitHub Pages

Select **GitHub Actions** under **Settings → Pages → Build and deployment**. The [Guidebook Pages workflow](.github/workflows/pages.yml) builds pull requests and deploys `main`.

Set the custom domain in Pages to `lastwar.ch4os.live`. The `lastwar` CNAME in the `ch4os.live` DNS zone should point to `cha0sarbiter.github.io`. Enable HTTPS in Pages after GitHub issues the certificate.
