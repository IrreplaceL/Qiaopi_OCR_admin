export const annotationData = [

  {

    "line_id": 1,

    "ocr_text": "外奉银陸元助林酒海城",

    "corrected_text": "外奉银陸元助林酒海城",

    "bbox": [20, 20, 103, 577],

    "score": 0.709,

    "entities": [

      {

        "type": "MONEY",

        "text": "银陸元",

        "start": 2,

        "end": 5

      }

    ]

  },

  {

    "line_id": 2,

    "ocr_text": "家雙親大人安登",

    "corrected_text": "家雙親大人安登",

    "bbox": [105, 20, 213, 577],

    "score": 0.844,

    "entities": [

      {

        "type": "PERSON",

        "text": "雙親大人",

        "start": 1,

        "end": 5

      },

      {

        "type": "BLESSING",

        "text": "安登",

        "start": 5,

        "end": 7

      }

    ]

  },

  {

    "line_id": 3,

    "ocr_text": "潮安古楼登科第内交",

    "corrected_text": "潮安古楼登科第内交",

    "bbox": [208, 18, 282, 579],

    "score": 0.872,

    "entities": [

      {

        "type": "PLACE",

        "text": "潮安",

        "start": 0,

        "end": 2

      },

      {

        "type": "PLACE",

        "text": "古楼",

        "start": 2,

        "end": 4

      }

    ]

  }

]
// 实体类型配置
export const entityTypes = [
  { type: "PERSON", label: "人名", color: "#3b82f6" },
  { type: "PLACE", label: "地名", color: "#10b981" },
  { type: "BLESSING", label: "祝福语", color: "#f59e0b" },
  { type: "DATE", label: "日期", color: "#8b5cf6" },
  { type: "MONEY", label: "金额", color: "#ef4444" }
]
