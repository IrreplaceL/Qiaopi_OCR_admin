# Qiaopi Image Annotation Admin

> A Vue 3 based admin frontend for OCR-assisted annotation of Qiaopi historical documents.

[中文](./README.md) | **English**

## Overview
This repository is a graduation project frontend built on top of [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin). It focuses on document annotation workflows for Qiaopi images, including OCR result visualization, manual correction, and annotation management.

## Implemented Features
- User authentication (login/register/basic permissions)
- Project group management
- Annotation list per project (card view)
- Create annotation by uploading image and calling OCR API
- Open existing annotation detail by `annotationId`
- Manual text correction and save
- Loading animations during OCR and save requests

## Annotation Routes
Defined in `src/router/modules/classinfo.ts`:
- `/classinfo/detail/:projectId/annotation/new` for creating a new annotation
- `/classinfo/detail/:projectId/annotation/:annotationId` for annotation detail

Entry points in `src/views/classinfo/detail.vue`:
- `Add Annotation Image` button
- Click on an annotation card

Detailed module documentation:
- `src/other/README.md`

## Tech Stack
- Vue 3
- TypeScript
- Vite
- Element Plus
- Tailwind CSS
- Pinia
- Vue Router
- Axios

## Setup
Requirements:
- Node.js `^18.18.0 || ^20.9.0 || >=21.1.0`
- pnpm `>=9`

Install dependencies:
```bash
pnpm install
```

Run in development:
```bash
pnpm dev
```

Build for production:
```bash
pnpm build
```

Preview build:
```bash
pnpm preview
```

## API Summary (Annotation)
- `POST /ocr/upload`
- `GET /annotation/detail`
- `POST /annotation/save`

Notes:
- `manualAnnotationJson` keeps the same structure as `ocrRawJson`.
- On save, the frontend preserves the OCR JSON structure and replaces `rec_texts` with corrected texts.

## License
MIT License.

- Original template: pure-admin-thin (MIT)
- Secondary development: Qiaopi Image Annotation System (2026)

See `LICENSE` for details.
