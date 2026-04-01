/**
 * API 请求模块
 * 包含所有HTTP请求相关的函数
 */

import { annotationData } from '../mockData1.js'

const API_BASE_URL = 'http://127.0.0.1:1031'

// 开发模式：设置为 true 使用 mock 数据，false 使用真实后端
const USE_MOCK_DATA = false

function parseJsonSafely(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function polyToBbox(poly = []) {
  if (!Array.isArray(poly) || poly.length === 0) return null
  const xs = []
  const ys = []

  poly.forEach(point => {
    if (Array.isArray(point) && point.length >= 2) {
      xs.push(Number(point[0]))
      ys.push(Number(point[1]))
    }
  })

  if (!xs.length || !ys.length) return null
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

/**
 * 将 ocrRawJson 解析为标注行数组
 * ocr_text 来自 ocrRawJson，corrected_text 来自 manualAnnotationJson（不存在则回退到 ocrRawJson）
 */
function normalizeLinesFromBoth(ocrRawJson, manualAnnotationJson) {
  const ocrRaw = parseJsonSafely(ocrRawJson)
  const ocrPruned = ocrRaw?.result?.ocrResults?.[0]?.prunedResult || ocrRaw?.prunedResult || ocrRaw

  if (!ocrPruned || !Array.isArray(ocrPruned.rec_texts)) return []

  const ocrTexts = ocrPruned.rec_texts || []
  const boxes = ocrPruned.rec_boxes || []
  const polys = ocrPruned.rec_polys || ocrPruned.dt_polys || []
  const scores = ocrPruned.rec_scores || []

  // 从 manualAnnotationJson 提取校正文本（结构与 ocrRawJson 相同）
  let correctedTexts = null
  if (manualAnnotationJson) {
    const manualRaw = parseJsonSafely(manualAnnotationJson)
    const manualPruned = manualRaw?.result?.ocrResults?.[0]?.prunedResult || manualRaw?.prunedResult || manualRaw
    if (manualPruned && Array.isArray(manualPruned.rec_texts)) {
      correctedTexts = manualPruned.rec_texts
    }
  }

  return ocrTexts.map((text, index) => {
    const bboxFromBox = Array.isArray(boxes[index]) && boxes[index].length >= 4
      ? boxes[index].map(Number)
      : null
    const bboxFromPoly = polyToBbox(polys[index])
    const bbox = bboxFromBox || bboxFromPoly || [0, 0, 0, 0]

    return {
      line_id: index + 1,
      ocr_text: text || '',
      corrected_text: correctedTexts?.[index] ?? text ?? '',
      bbox,
      score: Number(scores[index] ?? 0),
      entities: []
    }
  })
}

function unwrapUploadPayload(result) {
  let payload = result?.data ?? null

  // Some responses are wrapped as { code, data: { code, data, msg } }.
  if (payload && typeof payload === 'object' && !payload.ocrRawJson && payload.data) {
    payload = payload.data
  }

  return payload
}

/**
 * 上传图片并处理OCR识别
 * @param {File} file - 要上传的图片文件
 * @param {Object} params
 * @param {string|number} params.projectId
 * @param {string|number} params.userId
 * @returns {Promise<{annotationData:Array,imageUrl:string|null,rawData:Object|null}>}
 */
export async function processImage(file, { projectId, userId }) {
  // Mock 模式：直接返回模拟数据
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return Promise.resolve({
      annotationData,
      imageUrl: null,
      rawData: null
    })
  }

  if (!projectId || !userId) {
    throw new Error('缺少 projectId 或 userId')
  }

  const formData = new FormData()
  formData.append('file', file)

  const query = new URLSearchParams({
    projectId: String(projectId),
    userId: String(userId)
  })

  const response = await fetch(`${API_BASE_URL}/ocr/upload?${query.toString()}`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  const bizResult = result?.data
  const topCode = Number(result?.code)
  const bizCode = Number(bizResult?.code)
  const topOk = topCode === 0 || topCode === 200
  const bizOk = Number.isNaN(bizCode) || bizCode === 0 || bizCode === 200

  if (!topOk || !bizOk) {
    throw new Error(bizResult?.msg || result?.msg || '处理失败')
  }

  const payload = unwrapUploadPayload(result)
  const parsedAnnotationData = normalizeLinesFromBoth(payload?.ocrRawJson, null)

  return {
    annotationData: parsedAnnotationData,
    imageUrl: payload?.imageUrl || null,
    rawData: payload
  }
}

/**
 * 获取已有标注详情
 * @param {string|number} annotationId
 * @returns {Promise<Object>}
 */
export async function getAnnotationDetail(annotationId) {
  const query = new URLSearchParams({ annotationId: String(annotationId) })

  const response = await fetch(`${API_BASE_URL}/annotation/detail?${query.toString()}`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()

  if (result.code !== 200 && result.code !== 0) {
    throw new Error(result.msg || '获取标注详情失败')
  }

  // 直接返回完整的响应数据，让组件自己处理
  return result
}

/**
 * 保存人工标注结果
 * @param {Array} annotationData - 当前页面标注行数组
 * @param {Object} params
 * @param {string|number} params.annotationId
 * @param {string|number} params.annotatorId
 * @param {string} params.ocrRawJson - 原始 OCR JSON 字符串，用于保持结构一致
 * @returns {Promise<Object>}
 */
export async function saveAnnotation(annotationData, { annotationId, annotatorId, ocrRawJson }) {
  // 以 ocrRawJson 结构为基础，将 rec_texts 替换为校正文本
  const rawStructure = parseJsonSafely(ocrRawJson)
  if (rawStructure) {
    const prunedResult = rawStructure?.result?.ocrResults?.[0]?.prunedResult
    if (prunedResult && Array.isArray(prunedResult.rec_texts)) {
      prunedResult.rec_texts = annotationData.map(item => item.corrected_text || '')
    }
  }
  const manualAnnotationJson = JSON.stringify(rawStructure || {})

  const response = await fetch(`${API_BASE_URL}/annotation/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annotationId: Number(annotationId),
      annotatorId: Number(annotatorId),
      manualAnnotationJson
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  if (result.code !== 200 && result.code !== 0) {
    throw new Error(result.msg || '保存失败')
  }
  return result
}
