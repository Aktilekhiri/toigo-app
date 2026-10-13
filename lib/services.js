// Toigo paid services — the single place for names, prices and descriptions.
// Change a price here, run `node tools/build.mjs`, push: the site, the order form and the server all follow.
// The server always recomputes the price from this file; the browser never sends an amount.

export const CURRENCY = "KGS";

export const SERVICES = {
  custom: {
    price: 790,
    name: { ky: "Toigo Custom", ru: "Toigo Custom" },
    short: { ky: "Чакырууну биз өзүбүз жасап беребиз", ru: "Мы сами оформим приглашение" },
    includes: {
      ky: ["Дизайн тандоого жардам", "Сиз берген маалыматтарды толтурабыз", "Чакыруу текстин оңдоп-түзөйбүз", "Даяр баракты текшеребиз", "Шилтемени сизге жөнөтөбүз"],
      ru: ["Поможем выбрать дизайн", "Внесём ваши данные", "Оформим текст приглашения", "Проверим готовую страницу", "Пришлём вам ссылку"]
    }
  },
  premium: {
    price: 1490,
    name: { ky: "Toigo Premium Design", ru: "Toigo Premium Design" },
    short: { ky: "Жеке мукаба жана стиль", ru: "Персональная обложка и стиль" },
    includes: {
      ky: ["Custom’догу бардык нерсе", "Премиум коллекциядан дизайн, мукабада сиздин сүрөт", "Тоюңузга ылайык музыка, анимация жана сүрөттөрдү тандайбыз", "Кыргызча жана орусча жеке текст", "Даяр болгондон кийин бир жолу оңдоо"],
      ru: ["Всё, что входит в Custom", "Дизайн из премиум-коллекции с вашим фото на обложке", "Подберём музыку, анимацию и фото под ваш той", "Персональный текст на кыргызском и русском", "Одна согласованная правка после готовности"]
    }
  }
};

export const priceOf = id => (SERVICES[id] ? SERVICES[id].price : null);

// Order lifecycle. REFUNDED is intentionally absent: there is no refund procedure yet.
export const ORDER_STATUS = ["PENDING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED", "IN_PROGRESS", "COMPLETED"];

export const EVENT_TYPES = ["uylonuu", "kyz", "sunnot", "tushoo", "maarake", "tuulgan", "other"];
