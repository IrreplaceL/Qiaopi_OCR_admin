# Annotation Module

`src/other` contains the Qiaopi image annotation page and its API adapter.

- `src/other/views/AnnotationView.vue`: column-level annotation UI.
- `src/other/http/api.js`: upload/detail/list/save requests and data transforms.
- `src/other/styles/annotation.css`: annotation page styles.

All backend requests use the shared `/api` base from `src/api/base.ts`.
Development requests are proxied by Vite to `VITE_API_PROXY_TARGET`.

Main endpoints:

- `POST /api/ocr/upload?projectId={projectId}&userId={userId}`
- `GET /api/annotation/detail?annotationId={annotationId}`
- `GET /api/annotation/list?projectId={projectId}`
- `POST /api/annotation/save`
