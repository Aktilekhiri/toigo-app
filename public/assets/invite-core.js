// Toigo — shared invitation renderer.
// Used in the browser (constructor preview) and on the server (/i/:slug).
// Pure functions only: no DOM access here.
import { PREM, PREM_TPL, premCover, premOrn, premFinale } from "./invite-premium.js";

export const TYPES = {
  uylonuu: { ky: "Үйлөнүү той", ru: "Свадьба", names: "pair" },
  kyz:     { ky: "Кыз узатуу", ru: "Кыз узатуу", names: "kyz" },
  sunnot:  { ky: "Сүннөт той", ru: "Сүннөт той", names: "child" },
  tushoo:  { ky: "Тушоо кесүү", ru: "Тушоо кесүү", names: "child" },
  maarake: { ky: "Маараке", ru: "Юбилей", names: "jub" },
  tuulgan: { ky: "Туулган күн", ru: "День рождения", names: "bday" }
};

// Types with two names (groom & bride).
export const isPair = t => !!(TYPES[t] && TYPES[t].names === "pair");

export const TPL = [
  ...PREM_TPL,
  { id: "ivory",     name: { ky: "Ivory Elegance", ru: "Ivory Elegance" }, desc: { ky: "Сүт түсү, шампань сызыктары жана нафис гүл бутактары.", ru: "Молочный фон, тонкие линии шампань и деликатные цветочные веточки." }, types: ["uylonuu","kyz"] },
  { id: "anarp",     name: { ky: "Анар Premium", ru: "Анар Premium" }, desc: { ky: "Анар түсү, порошок жана роза-алтын рамка. Кыз узатуу үчүн.", ru: "Гранатовый фон, пудра и рамка из розового золота. Для кыз узатуу." }, types: ["kyz"] },
  { id: "emerald",   name: { ky: "Emerald Royal", ru: "Emerald Royal" }, desc: { ky: "Зымырыт түс, алтын геометрия жана каймак түстүү карточка.", ru: "Изумрудный фон, золотая геометрия и кремовая карточка." }, types: ["sunnot"] },
  { id: "steps",     name: { ky: "Little Steps", ru: "Little Steps" }, desc: { ky: "Кичинекей изчелер, булуттар жана жашыл адырлар.", ru: "Следы маленьких ножек, облака и мягкие зелёные холмы." }, types: ["tushoo","sunnot","tuulgan"] },
  { id: "golden",    name: { ky: "Golden Anniversary", ru: "Golden Anniversary" }, desc: { ky: "Кара фон, шампань түстөгү чоң сан жана ар-деко нурлары.", ru: "Чёрный фон, крупная цифра цвета шампань и лучи ар-деко." }, types: ["maarake"] },
  { id: "pop",       name: { ky: "Color Pop", ru: "Color Pop" }, desc: { ky: "Шарлар, конфетти жана ачык түстөр. Ар кандай жашка.", ru: "Шары, конфетти и яркие цвета. Для любого возраста." }, types: ["tuulgan","tushoo"] },
  { id: "heritage",  name: { ky: "Heritage", ru: "Heritage" }, desc: { ky: "Заманбап улуттук стиль: кыял оюму, кийиз түстөрү, ачык тор.", ru: "Современная национальная эстетика: узор кыял, цвета войлока, чистая сетка." }, types: ["uylonuu","kyz","sunnot","tushoo"] },
  { id: "botanical", name: { ky: "Botanical Garden", ru: "Botanical Garden" }, desc: { ky: "Шалфей жалбырактары жана жуптун сүрөтү үчүн арка.", ru: "Шалфейные листья и арка для фотографии пары." }, types: ["uylonuu"] },
  { id: "midnight",  name: { ky: "Midnight Sky", ru: "Midnight Sky" }, desc: { ky: "Түнкү асман, жылдыздар жана жумшак алтын жарык.", ru: "Ночное небо, звёзды и мягкое золотое свечение." }, types: ["uylonuu","maarake"] },
  { id: "editorial", name: { ky: "Modern Editorial", ru: "Modern Editorial" }, desc: { ky: "Чоң тамгалар, ак мейкиндик, ар бир тойго өз түсү.", ru: "Крупная типографика, много воздуха и свой акцент для каждого тоя." }, types: ["uylonuu","maarake","tuulgan"] },
  { id: "alatoo",  name: { ky: "Ала-Тоо",   ru: "Ала-Тоо" },   desc: { ky: "Кар баскан тоолор жана түнкү көк асман.", ru: "Снежные горы и ночная синева." }, types: ["uylonuu","kyz","sunnot","tushoo","maarake","tuulgan"] },
  { id: "akkalpak",name: { ky: "Ак калпак", ru: "Ак калпак" }, desc: { ky: "Ак түс жана калпактын кара сайма оюму.", ru: "Белый фон и чёрный узор, как вышивка на калпаке." }, types: ["uylonuu","kyz","sunnot","maarake","tuulgan"] },
  { id: "shyrdak", name: { ky: "Шырдак",    ru: "Шырдак" },    desc: { ky: "Кызыл кийиз жана «кочкор мүйүз» оюму.", ru: "Красный войлок и орнамент «кочкор мүйүз»." }, types: ["uylonuu","kyz","sunnot","tushoo","maarake"] },
  { id: "jibek",   name: { ky: "Жибек",     ru: "Жибек" },     desc: { ky: "Шалфей түсү жана жибек жиптей ичке сызыктар.", ru: "Шалфей и тонкие линии, как шёлковая нить." }, types: ["uylonuu","kyz","maarake","tuulgan"] },
  { id: "anar",    name: { ky: "Анар",      ru: "Анар" },      desc: { ky: "Анар түсү, алтын чекиттер. Кыз узатууга ылайык.", ru: "Гранатовый цвет и золотые точки. Для кыз узатуу." }, types: ["kyz","uylonuu","maarake"] },
  { id: "asman",   name: { ky: "Көк асман", ru: "Көк асман" }, desc: { ky: "Ачык асман жана ак булуттар. Балдар тою үчүн.", ru: "Светлое небо и облака. Для детских тоев." }, types: ["sunnot","tushoo","tuulgan"] }
];

export const IV = {
  ky: { inv: "Сиздерди тоюбузга чакырабыз", cd: "Тойго чейин калды", d: "күн", h: "саат", m: "мүнөт", s: "секунд",
        prog: "Программа", venue: "Той өтүүчү жер", dress: "Дресс-код", gal: "Сүрөттөр", rsvp: "Келе аласызбы?",
        by: "Жооп берүү мөөнөтү:", rn: "Аты-жөнүңүз", yes: "Келем", no: "Келе албайм", cnt: "Канча адам",
        note: "Каалоо-тилек", send: "Жооп жөнөтүү", thx: "Рахмат! Жообуңуз той ээлерине жетти.", err: "Атыңызды жазыңыз",
        fail: "Жиберилген жок. Интернетти текшерип, кайра басыңыз.", hosts: "Той ээлери", made: "Тойго аркылуу түзүлдү",
        scroll: "Ылдый жылдырыңыз", music: "Музыка", contact: "Байланыш", seat: "Сиздин ордуңуз", call: "Чалуу", preview: "Бул алдын ала көрүү. Жооп чыныгы чакырууда иштейт.",
        past: "Той өттү. Келгениңиздерге рахмат!", env_tap: "Ачуу үчүн басыңыз", env_for: "Сизге чакыруу", fin: "Сиздерди чын жүрөктөн күтөбүз" },
  ru: { inv: "Приглашаем вас на наш праздник", cd: "До праздника осталось", d: "дней", h: "часов", m: "минут", s: "секунд",
        prog: "Программа", venue: "Место проведения", dress: "Дресс-код", gal: "Фотографии", rsvp: "Вы придёте?",
        by: "ответьте до", rn: "Ваше имя", yes: "Приду", no: "Не смогу", cnt: "Сколько человек",
        note: "Пожелание", send: "Отправить ответ", thx: "Спасибо! Ваш ответ получен.", err: "Укажите имя",
        fail: "Не отправилось. Проверьте интернет и нажмите ещё раз.", hosts: "Хозяева тоя", made: "Сделано в Тойго",
        scroll: "Листайте вниз", music: "Музыка", contact: "Контакты", seat: "Ваше место", call: "Позвонить", preview: "Это предпросмотр. Ответы работают в настоящем приглашении.",
        past: "Праздник прошёл. Спасибо, что были с нами!", env_tap: "Нажмите, чтобы открыть", env_for: "Вам приглашение", fin: "Ждём вас с любовью" }
};

const MON = {
  ky: ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"]
};
const WD = {
  ky: ["жекшемби","дүйшөмбү","шейшемби","шаршемби","бейшемби","жума","ишемби"],
  ru: ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"]
};

// Per-type wording: invitation heading, countdown heading, sample names, message and programme.
export const TYPE_TEXT = {
  uylonuu: {
    ky: { inv: "Сиздерди үйлөнүү тоюбузга чакырабыз", cd: "Тойго чейин калды", n1: "Айбек", n2: "Айзада",
          msg: "Урматтуу туугандар, дос-тамырлар жана жакындарыбыз! Эки жаш жаңы үй-бүлө болуп кошулган кубанычтуу күндү сиздер менен бирге белгилегибиз келет. Салтанаттуу тоюбуздун төрүнөн орун алып, ак батаңыздарды бериңиздер.",
          msgs: ["Урматтуу туугандар, дос-тамырлар жана жакындарыбыз! Эки жаш жаңы үй-бүлө болуп кошулган кубанычтуу күндү сиздер менен бирге белгилегибиз келет. Салтанаттуу тоюбуздун төрүнөн орун алып, ак батаңыздарды бериңиздер.", "Кадырлуу коногубуз! Ак никебиздин күбөсү болуп, жаңы жашообуздун алгачкы күнүн биз менен бөлүшүңүз. Сиздин катышууңуз биз үчүн чоң сый жана кубаныч.", "Сүйүү, ынтымак жана бакыт менен башталган жаңы үй-бүлөнүн тоюна чакырабыз! «Куш боо бек болсун» деген тилегиңиз менен келиңиздер, сиздерди чын жүрөктөн күтөбүз."],
          prog: "17:00 — Конокторду тосуу\n18:00 — Нике кыюу\n19:00 — Той башталат\n23:00 — Коштошуу" },
    ru: { inv: "Приглашаем вас на нашу свадьбу", cd: "До свадьбы осталось", n1: "Айбек", n2: "Айзада",
          msg: "Дорогие родные, друзья и близкие! Два сердца решили идти по жизни вместе, и мы хотим разделить этот радостный день с вами. Будем счастливы видеть вас на нашем торжестве и услышать ваше благословение.",
          msgs: ["Дорогие родные, друзья и близкие! Два сердца решили идти по жизни вместе, и мы хотим разделить этот радостный день с вами. Будем счастливы видеть вас на нашем торжестве и услышать ваше благословение.", "Дорогой гость! Приглашаем вас стать свидетелем рождения новой семьи. Ваше присутствие — самый ценный подарок для нас.", "Любовь, согласие и счастье — с этого начинается новая семья. Приходите разделить с нами радость этого дня. Ждём вас всем сердцем!"],
          prog: "17:00 — Встреча гостей\n18:00 — Никах\n19:00 — Начало тоя\n23:00 — Завершение" }
  },
  kyz: {
    ky: { inv: "Сиздерди кызыбыздын узатуу тоюна чакырабыз", cd: "Тойго чейин калды", n1: "Айзада", n2: "",
          msg: "Урматтуу туугандар жана досторубуз! Жаңы үйгө узатылып жаткан кызыбыздын кыз узатуу тоюна чакырабыз. Ак батаңыздар менен анын жолун ачалы.",
          msgs: ["Урматтуу туугандар жана досторубуз! Жаңы үйгө узатылып жаткан кызыбыздын кыз узатуу тоюна чакырабыз. Ак батаңыздар менен анын жолун ачалы.", "Кадырлуу коногубуз! Эркелетип өстүргөн кызыбызды бактылуу турмушка узатуу күнү келди. Бул маанилүү күнү жаныбызда болуп, кубанычыбызды бөлүшүңүз.", "Кызыбыз жаңы жашоого кадам таштап жатат. Ак жолуна ак тилек айтып, узатуу тоюбуздун урматтуу коногу болуңуз!"],
          prog: "16:00 — Конокторду тосуу\n17:00 — Кыз узатуу салты\n18:00 — Той башталат\n22:00 — Коштошуу" },
    ru: { inv: "Приглашаем вас на кыз узатуу нашей дочери", cd: "До тоя осталось", n1: "Айзада", n2: "",
          msg: "Дорогие родные и друзья! Наша дочь начинает новую жизнь, и мы приглашаем вас на её кыз узатуу. Проводим её вместе — с добрыми пожеланиями и благословением.",
          msgs: ["Дорогие родные и друзья! Наша дочь начинает новую жизнь, и мы приглашаем вас на её кыз узатуу. Проводим её вместе — с добрыми пожеланиями и благословением.", "Дорогой гость! Пришёл день, когда мы провожаем нашу любимую дочь в счастливую семейную жизнь. Будем рады видеть вас рядом в этот важный для нас день.", "Наша дочь делает первый шаг в новую жизнь. Приходите пожелать ей доброго пути и разделить с нами этот светлый праздник!"],
          prog: "16:00 — Встреча гостей\n17:00 — Обряд кыз узатуу\n18:00 — Начало тоя\n22:00 — Завершение" }
  },
  sunnot: {
    ky: { inv: "Сиздерди уулубуздун сүннөт тоюна чакырабыз", cd: "Тойго чейин калды", n1: "Нурислам", n2: "",
          msg: "Урматтуу туугандар жана досторубуз! Уулубуздун сүннөт тоюна чакырабыз. Ак батаңыздарды берип, кубанычыбызды бөлүшүңүздөр.",
          msgs: ["Урматтуу туугандар жана досторубуз! Уулубуздун сүннөт тоюна чакырабыз. Ак батаңыздарды берип, кубанычыбызды бөлүшүңүздөр.", "Кадырлуу коногубуз! Салт боюнча уулубуздун сүннөт тоюн өткөрүп жатабыз. Бул маанилүү күнү сизди дасторконубуздун төрүндө көргүбүз келет.", "Уулубуз азамат болуп өсүп келатат! Анын сүннөт тоюна келип, ак тилегиңизди айтыңыз. Сиздерди чын жүрөктөн күтөбүз."],
          prog: "13:00 — Конокторду тосуу\n14:00 — Бата, куран окуу\n15:00 — Той башталат\n19:00 — Коштошуу" },
    ru: { inv: "Приглашаем вас на сүннөт той нашего сына", cd: "До тоя осталось", n1: "Нурислам", n2: "",
          msg: "Дорогие родные и друзья! Приглашаем вас на сүннөт той нашего сына. Будем рады вашему благословению и добрым пожеланиям.",
          msgs: ["Дорогие родные и друзья! Приглашаем вас на сүннөт той нашего сына. Будем рады вашему благословению и добрым пожеланиям.", "Дорогой гость! По доброй традиции мы проводим сүннөт той нашего сына и хотим видеть вас в этот важный день за нашим дасторконом.", "Наш сын растёт настоящим джигитом! Приходите на его сүннөт той и скажите ему доброе слово. Ждём вас всем сердцем."],
          prog: "13:00 — Встреча гостей\n14:00 — Бата, чтение Корана\n15:00 — Начало тоя\n19:00 — Завершение" }
  },
  tushoo: {
    ky: { inv: "Сиздерди балабыздын тушоо кесүү тоюна чакырабыз", cd: "Тойго чейин калды", n1: "Айсулуу", n2: "",
          msg: "Урматтуу туугандар жана досторубуз! Балабыз алгачкы кадамдарын шилтеп жатат. Анын тушоосун кесип, ак жол каалоо үчүн тушоо кесүү тоюбузга чакырабыз.",
          msgs: ["Урматтуу туугандар жана досторубуз! Балабыз алгачкы кадамдарын шилтеп жатат. Анын тушоосун кесип, ак жол каалоо үчүн тушоо кесүү тоюбузга чакырабыз.", "Кадырлуу коногубуз! Кичинекейибиздин биринчи кадамдарын бирге белгилейли. Тушоосун кесип, келечегине ак тилек айтып бериңиз.", "Жолу ачык, кадамы бекем болсун! Балабыздын тушоо кесүү тоюна келип, кубанычыбызды бөлүшүңүз."],
          prog: "12:00 — Конокторду тосуу\n13:00 — Тушоо кесүү салты\n14:00 — Дасторкон\n17:00 — Коштошуу" },
    ru: { inv: "Приглашаем вас на тушоо кесүү нашего малыша", cd: "До тоя осталось", n1: "Айсулуу", n2: "",
          msg: "Дорогие родные и друзья! Наш малыш делает первые шаги. Приглашаем вас на тушоо кесүү, чтобы разрезать его путы и пожелать ему доброго пути.",
          msgs: ["Дорогие родные и друзья! Наш малыш делает первые шаги. Приглашаем вас на тушоо кесүү, чтобы разрезать его путы и пожелать ему доброго пути.", "Дорогой гость! Давайте вместе отметим первые шаги нашего малыша. Будем рады, если вы разрежете его путы и скажете ему доброе слово.", "Пусть его дорога будет лёгкой, а шаги — уверенными! Приходите на тушоо кесүү нашего малыша и разделите с нами эту радость."],
          prog: "12:00 — Встреча гостей\n13:00 — Обряд тушоо кесүү\n14:00 — Дасторкон\n17:00 — Завершение" }
  },
  maarake: {
    ky: { inv: "Сиздерди мааракебизге чакырабыз", cd: "Мааракеге чейин калды", n1: "Бакыт ата", n2: "",
          msg: "Урматтуу туугандар, дос-тамырлар жана кесиптештер! Ардактуу мааракени сиздер менен бирге белгилегибиз келет. Мааракелик кечебиздин урматтуу коногу болуңуздар.",
          msgs: ["Урматтуу туугандар, дос-тамырлар жана кесиптештер! Ардактуу мааракени сиздер менен бирге белгилегибиз келет. Мааракелик кечебиздин урматтуу коногу болуңуздар.", "Кадырлуу коногубуз! Жылдар бою жанында болгон жакындарыбыз менен бул кубанычтуу күндү чогуу тосууну каалайбыз. Сизди чын жүрөктөн күтөбүз.", "Ар бир жыл — эскерүү, ар бир эскерүү — кубаныч. Мааракебизге келип, жылуу сөзүңүздү айтыңыз!"],
          prog: "17:00 — Конокторду тосуу\n18:00 — Маараке башталат\n19:00 — Куттуктоолор\n23:00 — Коштошуу" },
    ru: { inv: "Приглашаем вас на юбилей", cd: "До юбилея осталось", n1: "Бакыт ата", n2: "",
          msg: "Дорогие родные, друзья и коллеги! Приглашаем вас отметить вместе с нами юбилей. Будем рады видеть вас почётными гостями нашего праздничного вечера.",
          msgs: ["Дорогие родные, друзья и коллеги! Приглашаем вас отметить вместе с нами юбилей. Будем рады видеть вас почётными гостями нашего праздничного вечера.", "Дорогой гость! Хотим встретить этот радостный день с теми, кто был рядом все эти годы. Ждём вас всем сердцем.", "Каждый год — это воспоминания, каждое воспоминание — радость. Приходите на наш юбилей и скажите тёплое слово!"],
          prog: "17:00 — Встреча гостей\n18:00 — Начало юбилея\n19:00 — Поздравления\n23:00 — Завершение" }
  },
  tuulgan: {
    ky: { inv: "Сиздерди туулган күнгө чакырабыз", cd: "Туулган күнгө чейин калды", n1: "Алина", n2: "",
          msg: "Достор! Туулган күнүмдү сиздер менен бирге шаңдуу белгилегим келет. Келсеңиздер абдан кубанам!",
          msgs: ["Достор! Туулган күнүмдү сиздер менен бирге шаңдуу белгилегим келет. Келсеңиздер абдан кубанам!", "Кымбаттуу коногум! Жаңы жашымды эң жакын адамдарым менен тосууну каалайм. Жылуу маанай жана көңүлдүү кече сизди күтүп турат.", "Торт, музыка жана жакшы маанай даяр, сиз гана жетишпей жатасыз! Туулган күнүмө келиңиз."],
          prog: "18:00 — Конокторду тосуу\n18:30 — Дасторкон\n20:00 — Торт жана куттуктоолор" },
    ru: { inv: "Приглашаем вас на день рождения", cd: "До дня рождения осталось", n1: "Алина", n2: "",
          msg: "Друзья! Хочу отметить свой день рождения вместе с вами. Очень жду каждого из вас!",
          msgs: ["Друзья! Хочу отметить свой день рождения вместе с вами. Очень жду каждого из вас!", "Дорогой гость! Хочу встретить новый год жизни в кругу самых близких. Вас ждут тёплая атмосфера и весёлый вечер.", "Торт, музыка и хорошее настроение уже готовы — не хватает только вас! Приходите на мой день рождения."],
          prog: "18:00 — Встреча гостей\n18:30 — Праздничный стол\n20:00 — Торт и поздравления" }
  }
};

export const DEFAULTS = {
  v: 1, type: "uylonuu", tpl: "silk", lang: "ky",
  n1: "Айбек", n2: "Айзада", hosts: "Асановдор үй-бүлөсү",
  date: "2027-06-12", time: "17:00", venue: "«Шумкар» той үйү", addr: "Бишкек, Чүй проспектиси, 150",
  msg: "Урматтуу туугандар, дос-тамырлар жана жакындарыбыз! Эки жаш жаңы үй-бүлө болуп кошулган кубанычтуу күндү сиздер менен бирге белгилегибиз келет. Салтанаттуу тоюбуздун төрүнөн орун алып, ак батаңыздарды бериңиздер.",
  prog: "17:00 — Конокторду тосуу\n18:00 — Нике кыюу\n19:00 — Той башталат\n23:00 — Коштошуу",
  dress: "", dl: "2027-06-01", phone: "", music: true, track: "komuz", env: true, photos: []
};

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const TR = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"j",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",ң:"ng",о:"o",ө:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ү:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sh",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
export const slugify = s => String(s || "").toLowerCase().split("").map(c => TR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function baseSlug(d) {
  const p = parseD(d.date);
  const parts = [slugify(d.n1), isPair(d.type) ? slugify(d.n2) : ""].filter(Boolean);
  if (!parts.length) parts.push("toi");
  if (p) parts.push(String(p.y));
  return parts.join("-");
}

// Server-side and client-side cleaning: whitelist fields, clamp lengths.
// Background tracks. "komuz" is Toigo's own; the others are royalty-free tracks chosen by the owner.
export const TRACKS = [
  { id: "komuz", file: "toi-music-3", ky: "Комуз (Тойго)", ru: "Комуз (Тойго)" },
  { id: "atlas", file: "toi-atlas-1", ky: "Atlas Kyrgyzstan", ru: "Atlas Kyrgyzstan" },
  { id: "m3", file: "toi-melody-3", ky: "Обон 3", ru: "Мелодия 3" },
  { id: "m4", file: "toi-melody-4", ky: "Обон 4", ru: "Мелодия 4" }
];
export const trackFile = id => (TRACKS.find(t => t.id === id) || TRACKS[0]).file;

export function clean(input) {
  const d = {}; const i = input && typeof input === "object" ? input : {};
  const str = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n);
  d.v = 1;
  d.type = TYPES[i.type] ? i.type : "uylonuu"; // old "nikah" invitations fall back to wedding
  d.tpl = TPL.some(t => t.id === i.tpl) ? i.tpl : "alatoo";
  d.lang = ["ky", "ru", "both"].includes(i.lang) ? i.lang : "ky";
  d.n1 = str(i.n1, 60); d.n2 = str(i.n2, 60); d.hosts = str(i.hosts, 120);
  d.date = /^\d{4}-\d{2}-\d{2}$/.test(i.date || "") ? i.date : "";
  d.time = /^\d{2}:\d{2}$/.test(i.time || "") ? i.time : "";
  d.dl = /^\d{4}-\d{2}-\d{2}$/.test(i.dl || "") ? i.dl : "";
  d.venue = str(i.venue, 120); d.addr = str(i.addr, 200); d.hall = str(i.hall, 80);
  { const a = parseInt(i.age, 10); d.age = a >= 1 && a <= 120 ? a : ""; }
  d.msg = str(i.msg, 1200); d.dress = str(i.dress, 200);
  d.prog = str(i.prog, 1500).split("\n").slice(0, 20).join("\n");
  d.phone = str(i.phone, 24).replace(/[^\d+]/g, "");
  d.music = i.music !== false;
  d.track = TRACKS.some(t => t.id === i.track) ? i.track : "komuz";
  d.fx = i.fx !== false;
  d.env = i.env !== false;
  d.photos = Array.isArray(i.photos) ? i.photos.filter(x => /^[a-z0-9]{20}$/.test(x)).slice(0, 6) : [];
  return d;
}

export function parseD(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
export function longDate(s, lang) { const p = parseD(s); if (!p) return ""; return lang === "ky" ? `${p.y}-ж., ${p.d}-${MON.ky[p.m]}` : `${p.d} ${MON.ru[p.m]} ${p.y}`; }
function weekday(s, lang) { const p = parseD(s); if (!p) return ""; return WD[lang][new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay()]; }
function numDate(s) { const p = parseD(s); if (!p) return ""; return `${String(p.d).padStart(2, "0")} · ${String(p.m + 1).padStart(2, "0")} · ${p.y}`; }

// Bishkek time (UTC+6) — events happen in Kyrgyzstan.
export function eventTs(d) {
  const p = parseD(d.date); if (!p) return 0;
  const [h, mi] = (d.time || "00:00").split(":").map(Number);
  return Date.UTC(p.y, p.m, p.d, (h || 0) - 6, mi || 0);
}

export function titleOf(d, lang) {
  const L = lang === "both" ? "ky" : lang;
  const who = isPair(d.type) ? [d.n1, d.n2].filter(Boolean).join(" & ") : d.n1;
  return `${who || "…"} — ${TYPES[d.type][L]}`;
}

const HORN = '<svg class="orn" aria-hidden="true" viewBox="0 0 40 24"><path d="M20 23C20 13 15 6 9 6C4 6 2 10 3.5 13C5 16 9.5 15.5 9.5 12.5C9.5 10.5 7.5 9.5 6.3 10.6M20 23C20 13 25 6 31 6C36 6 38 10 36.5 13C35 16 30.5 15.5 30.5 12.5C30.5 10.5 32.5 9.5 33.7 10.6M20 23V2M17 5L20 2L23 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>';
const CLOUD = '<path d="M20 45 Q0 45 6 30 Q8 18 26 22 Q32 4 54 10 Q70 0 82 16 Q104 12 104 30 Q118 34 110 45Z" fill="currentColor"/>';

function decor(id, mini) {
  switch (id) {
    case "alatoo": return `<svg class="mtn" viewBox="0 0 340 140" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 140 L0 96 L48 58 L82 84 L130 30 L170 70 L206 44 L250 86 L290 52 L340 92 L340 140Z" fill="rgba(255,255,255,.06)"/>
      <path d="M118 44 L130 30 L142 42 L136 40 L130 46 L124 40Z M196 52 L206 44 L216 54 L210 52 L205 56Z M280 60 L290 52 L300 62 L294 60 L289 64Z" fill="#EFEBE3" opacity=".85"/>
      <path d="M0 140 L0 116 L60 92 L104 112 L160 82 L214 110 L262 96 L340 120 L340 140Z" fill="rgba(0,0,0,.2)"/></svg>`;
    case "shyrdak": case "akkalpak": { const b = Array(mini ? 6 : 8).fill(HORN).join(""); return `<div class="iband top">${b}</div><div class="iband bot">${b}</div>`; }
    case "jibek": return `<div class="frame"></div>`;
    case "anar": return `<div class="dots"></div><div class="iarch"></div>`;
    case "asman": return `<svg class="cloud c1" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg><svg class="cloud c2" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg>`;
  }
  return "";
}

function mk(lang) {
  const both = lang === "both";
  return {
    L: k => both ? `${IV.ky[k]}<span class="alt">${IV.ru[k]}</span>` : IV[lang][k],
    P: k => both ? `${IV.ky[k]} / ${IV.ru[k]}` : IV[lang][k],
    TT: (t, k) => { const o = TYPE_TEXT[t] || TYPE_TEXT.uylonuu; return both ? `${o.ky[k]}<span class="alt">${o.ru[k]}</span>` : o[lang][k]; },
    type: t => { const o = TYPES[t]; return both ? (o.ky === o.ru ? o.ky : `${o.ky}<span class="alt">${o.ru}</span>`) : o[lang]; },
    date: s => both ? `${longDate(s, "ky")}<span class="alt">${longDate(s, "ru")}</span>` : longDate(s, lang),
    wd: s => both ? `${weekday(s, "ky")} / ${weekday(s, "ru")}` : weekday(s, lang),
    deadline: s => {
      if (!s) return "";
      if (both) return `${IV.ky.by} ${longDate(s, "ky")}<span class="alt">${IV.ru.by.replace(/^./, c => c.toUpperCase())} ${longDate(s, "ru")}</span>`;
      return lang === "ky" ? `${IV.ky.by} ${longDate(s, "ky")}` : `${IV.ru.by.replace(/^./, c => c.toUpperCase())} ${longDate(s, "ru")}`;
    }
  };
}

function names(d) {
  const a = esc(d.n1 || "…"); if (!isPair(d.type)) return a;
  return `${a}<span class="amp">&amp;</span>${esc(d.n2 || "…")}`;
}

// ---------- templates v2: each has its own cover composition ----------
export const NEW_TPL = new Set(["ivory","anarp","emerald","steps","golden","pop","heritage","botanical","midnight","editorial"]);
export const invClass = (tpl, type) => `inv t-${tpl}${NEW_TPL.has(tpl) ? " nw" : PREM.has(tpl) ? " nw pr" : ""} ty-${type || "uylonuu"}`;

const ruYears = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "год" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "года" : "лет"; };
function ageWord(n, lang) { return lang === "ru" ? ruYears(n) : lang === "both" ? `жаш / ${ruYears(n)}` : "жаш"; }
const hasAge = d => d.age && (d.type === "maarake" || d.type === "tuulgan");
function eyebrow(d, T) { return T.type(d.type) + (hasAge(d) && !["golden","pop","editorial"].includes(d.tpl) ? ` · ${d.age} ${ageWord(d.age, d.lang)}` : ""); }
function dparts(d) {
  const p = parseD(d.date); if (!p) return null;
  const L = d.lang === "ru" ? "ru" : "ky";
  return { day: p.d, dd: String(p.d).padStart(2, "0"), mm: String(p.m + 1).padStart(2, "0"), y: p.y, mon: MON[L][p.m], monKy: MON.ky[p.m] };
}
const when = (d, T) => `${esc(T.wd(d.date))}${d.time ? " · " + esc(d.time) : ""}`;
const initials = d => [d.n1, isPair(d.type) ? d.n2 : ""].filter(Boolean).map(x => x.trim()[0] || "").join(" & ").toUpperCase();

// small ornaments (currentColor)
const SPRIG = '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M8 26C38 8 82 8 112 26" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor"><ellipse cx="30" cy="16" rx="6" ry="2.2" transform="rotate(-35 30 16)"/><ellipse cx="32" cy="22" rx="6" ry="2.2" transform="rotate(30 32 22)"/><ellipse cx="90" cy="16" rx="6" ry="2.2" transform="rotate(35 90 16)"/><ellipse cx="88" cy="22" rx="6" ry="2.2" transform="rotate(-30 88 22)"/><ellipse cx="46" cy="11" rx="5" ry="1.9" transform="rotate(-20 46 11)"/><ellipse cx="74" cy="11" rx="5" ry="1.9" transform="rotate(20 74 11)"/><circle cx="60" cy="10.5" r="1.6"/></g><circle cx="60" cy="10.5" r="4.2" fill="none" stroke="currentColor"/></svg>';
const FLOWER = '<svg viewBox="0 0 60 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1">' + [0,45,90,135,180,225,270,315].map(a => `<ellipse cx="30" cy="16" rx="6" ry="12" transform="rotate(${a} 30 30)"/>`).join("") + '<circle cx="30" cy="30" r="6"/></g><circle cx="30" cy="30" r="2.4" fill="currentColor"/></svg>';
const CORNER = '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M2 58V30C2 14 14 2 30 2h28M8 58V32C8 18 18 8 32 8h26" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M14 46c0-12 8-24 22-26M20 20c-3-3-3-8 1-10s8 1 7 5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="8" r="2.6" fill="currentColor"/></svg>';
const STAR8 = '<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2"><rect x="9" y="9" width="22" height="22"/><rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="4.5"/></g></svg>';
const FOOT = '<g fill="currentColor"><ellipse cx="0" cy="6" rx="5" ry="8"/><circle cx="-4.5" cy="-5.5" r="1.7"/><circle cx="-1" cy="-7.5" r="1.8"/><circle cx="2.8" cy="-7" r="1.6"/><circle cx="5.6" cy="-4.6" r="1.4"/></g>';
const FEET = '<svg class="feet" viewBox="0 0 300 90" aria-hidden="true">' + [[30,70,-20,0],[62,58,-12,1],[100,62,-8,0],[136,46,-2,1],[176,50,4,0],[212,34,10,1],[252,38,16,0]].map(([x,y,r,f]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${f ? -1 : 1} 1) scale(.9)" opacity="${0.35 + x / 500}">${FOOT}</g>`).join("") + '</svg>';
const BALLOON = c => `<g><path d="M0 52c-3 10 4 16 0 26" fill="none" stroke="#9AA5AE" stroke-width="1"/><ellipse cx="0" cy="24" rx="20" ry="25" fill="${c}"/><path d="M-4 48h8l-4 5z" fill="${c}"/><ellipse cx="-7" cy="13" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 -7 13)"/></g>`;
const BALLOONS = '<svg class="balloons" viewBox="0 0 140 130" aria-hidden="true"><g transform="translate(36 30)">' + BALLOON("#86C9E8") + '</g><g transform="translate(78 8) rotate(6)">' + BALLOON("#FF786B") + '</g><g transform="translate(112 38) rotate(12)">' + BALLOON("#FFD66B") + '</g></svg>';
function burst() { let r = ""; for (let i = 0; i <= 18; i++) { const a = Math.PI * (i / 18); r += `<line x1="200" y1="420" x2="${(200 - Math.cos(a) * 420).toFixed(1)}" y2="${(420 - Math.sin(a) * 420).toFixed(1)}"/>`; } return `<svg class="burst" viewBox="0 0 400 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g stroke="currentColor" stroke-width=".8">${r}</g><circle cx="200" cy="420" r="120" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="200" cy="420" r="160" fill="none" stroke="currentColor" stroke-width=".5"/></svg>`; }
function kyal(n) { let g = ""; for (let i = 0; i < n; i++) { const x = i * 24; g += `<path d="M${x} 12l12-10 12 10-12 10z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M${x + 12} 8l4 4-4 4-4-4z" fill="currentColor"/>`; } return `<svg viewBox="0 0 ${n * 24} 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${g}<path d="M0 1H${n * 24}M0 23H${n * 24}" stroke="currentColor" stroke-width=".8"/></svg>`; }
const BRANCH = '<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M4 156C40 120 70 70 150 6" fill="none" stroke="currentColor" stroke-width="1.4"/><g fill="currentColor">' + [[30,128,-60],[44,112,30],[58,96,-55],[72,82,35],[88,66,-50],[104,52,40],[120,38,-45],[136,22,45]].map(([x,y,r],i) => `<ellipse cx="${x}" cy="${y}" rx="${13 - i * 0.6}" ry="${5 - i * 0.2}" transform="rotate(${r} ${x} ${y})" opacity="${0.55 + (i % 2) * 0.3}"/>`).join("") + '</g></svg>';
const WREATH = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor">' + Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2, x = 60 + Math.cos(a) * 44, y = 60 + Math.sin(a) * 44, r = a * 180 / Math.PI + (i % 2 ? 40 : -40); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="2.6" transform="rotate(${r.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" opacity="${i % 3 ? 0.55 : 0.9}"/>`; }).join("") + '</g></svg>';
function stars() { let x = 7, g = ""; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 70; i++) { const cx = (rnd() * 400).toFixed(1), cy = (rnd() * 640).toFixed(1), r = (0.4 + rnd() * 1.3).toFixed(2); g += `<circle cx="${cx}" cy="${cy}" r="${r}" opacity="${(0.35 + rnd() * 0.65).toFixed(2)}"/>`; } return `<svg class="sky" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#F9F7F1">${g}</g></svg>`; }
const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="currentColor"/></svg>';
const DIAMOND = '<svg viewBox="0 0 120 20" aria-hidden="true"><path d="M0 10h48M72 10h48" stroke="currentColor" stroke-width="1"/><path d="M60 2l8 8-8 8-8-8z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M60 6l4 4-4 4-4-4z" fill="currentColor"/></svg>';

// divider ornament under the cover, per template
function orn(tpl) {
  if (PREM.has(tpl)) return premOrn(tpl);
  const w = s => `<span class="orn orn-${tpl}" aria-hidden="true">${s}</span>`;
  switch (tpl) {
    case "ivory": return w(SPRIG);
    case "anarp": return w(FLOWER);
    case "emerald": return w(STAR8);
    case "steps": return w('<svg viewBox="0 0 40 30">' + `<g transform="translate(13 16) rotate(-12)">${FOOT}</g><g transform="translate(28 12) rotate(12) scale(-1 1)">${FOOT}</g>` + '</svg>');
    case "golden": case "heritage": return w(DIAMOND);
    case "pop": return w('<svg viewBox="0 0 60 20"><circle cx="8" cy="10" r="5" fill="#FF786B"/><circle cx="30" cy="10" r="5" fill="#FFD66B"/><circle cx="52" cy="10" r="5" fill="#86C9E8"/></svg>');
    case "botanical": return w(SPRIG);
    case "midnight": return w(SPARK);
    case "editorial": return '<span class="orn orn-editorial" aria-hidden="true"></span>';
  }
  return HORN;
}

function coverNew(d, T, opts) {
  const p = dparts(d), mini = !!opts.mini, nm = `<h1 class="nm">${names(d)}</h1>`, ey = `<div class="ey">${eyebrow(d, T)}</div>`;
  const dot = p ? `${p.dd} · ${p.mm} · ${p.y}` : "";
  const longD = p ? (d.lang === "ru" ? `${p.day} ${p.mon} ${p.y}` : `${p.y}-ж., ${p.day}-${p.monKy}`) : "";
  const sub = `<div class="sub">${when(d, T)}</div>`;
  const photo = !mini && d.photos && d.photos.length && opts.photoUrl ? opts.photoUrl(d.photos[0]) : "";
  switch (d.tpl) {
    case "ivory": return `<div class="cv"><div class="ivf"></div><div class="spr">${SPRIG}</div>${ey}${nm}<div class="ivr"><i></i><b></b><i></i></div><div class="dt">${dot}</div>${sub}<div class="spr flip">${SPRIG}</div></div>`;
    case "anarp": return `<div class="cv"><div class="ap-frame"></div>${["tl","tr","bl","br"].map(c => `<span class="cn ${c}">${CORNER}</span>`).join("")}<div class="fl">${FLOWER}</div>${ey}${nm}<div class="dt">${longD}</div>${sub}</div>`;
    case "emerald": return `<div class="cv"><div class="em-card"><div class="st">${STAR8}</div>${ey}${nm}<div class="ivr"><i></i><b></b><i></i></div><div class="dt">${dot}</div>${sub}</div></div>`;
    case "steps": return `<div class="cv"><span class="sun"></span><svg class="cloud c1" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg><svg class="cloud c2" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg>${ey}${nm}<div class="dt">${p ? `${p.day} ${d.lang === "ru" ? p.mon : p.monKy}` : ""}</div>${sub}${FEET}<svg class="hills" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60C80 20 150 30 220 52S340 70 400 40V90H0Z" fill="#A9C3A0" opacity=".55"/><path d="M0 72C90 48 170 60 250 74S350 80 400 66V90H0Z" fill="#8FB089"/></svg></div>`;
    case "golden": return `<div class="cv">${burst()}<div class="ey">${T.type(d.type)}</div>${hasAge(d) ? `<div class="big">${d.age}</div><div class="bigl">${ageWord(d.age, d.lang)}</div>` : `<div class="dia">${DIAMOND}</div>`}${nm}<div class="dt">${dot}</div>${sub}</div>`;
    case "pop": return `<div class="cv">${BALLOONS}<span class="cf"></span><div class="ey">${T.type(d.type)}</div>${hasAge(d) ? `<div class="big">${d.age}</div>` : ""}${nm}<div class="dt">${p ? `${p.day} ${d.lang === "ru" ? p.mon : p.monKy}${d.time ? " · " + esc(d.time) : ""}` : ""}</div><div class="sub">${esc(T.wd(d.date))}</div></div>`;
    case "heritage": return `<div class="cv"><div class="hb">${kyal(16)}</div><div class="hg"><div class="hl">${ey}${nm}</div>${p ? `<div class="hd"><b>${p.dd}</b><span>${d.lang === "ru" ? p.mon : p.monKy}</span><span>${p.y}</span></div>` : ""}</div>${sub}<div class="hb bot">${kyal(16)}</div></div>`;
    case "botanical": return `<div class="cv"><span class="lf tl">${BRANCH}</span><span class="lf br">${BRANCH}</span>${photo ? `<div class="ph"><img src="${esc(photo)}" alt=""></div>` : `<div class="wr">${WREATH}<span>${esc(initials(d))}</span></div>`}${ey}${nm}<div class="dt">${longD}</div>${sub}</div>`;
    case "midnight": return `<div class="cv">${stars()}<span class="moon"></span>${ey}${nm}<div class="spk">${SPARK}</div><div class="dt">${dot}</div>${sub}</div>`;
    case "editorial": return `<div class="cv"><div class="ey">${T.type(d.type)}</div>${hasAge(d) ? `<div class="big">${d.age}</div>` : ""}${nm}<div class="edd">${p ? `<b>${p.dd}.${p.mm}</b><span>${p.y}</span>` : ""}<span>${when(d, T)}</span></div><span class="bar"></span></div>`;
  }
  return "";
}

function premHelpers(d, T) {
  const p = dparts(d);
  return { esc, names: names(d), ey: eyebrow(d, T), p, dot: p ? `${p.dd} · ${p.mm} · ${p.y}` : "",
    longD: p ? (d.lang === "ru" ? `${p.day} ${p.mon} ${p.y}` : `${p.y}-ж., ${p.day}-${p.monKy}`) : "",
    when: when(d, T), typeLabel: TYPES[d.type][d.lang === "ru" ? "ru" : "ky"], fin: T.L("fin") };
}

export function coverHTML(d, opts = {}) {
  const T = mk(d.lang), mini = !!opts.mini;
  if (NEW_TPL.has(d.tpl)) return coverNew(d, T, opts);
  if (PREM.has(d.tpl)) return premCover(d, premHelpers(d, T), opts);
  return `<div class="cv">${decor(d.tpl, mini)}
    <div class="ey">${eyebrow(d, T)}</div>
    ${["alatoo", "asman", "anar", "jibek"].includes(d.tpl) ? HORN : ""}
    <h1 class="nm">${names(d)}</h1>
    <div class="dt">${numDate(d.date)}</div>
    <div class="sub">${esc(T.wd(d.date))}${d.time ? " · " + esc(d.time) : ""}</div>
  </div>`;
}

export function parseProg(s) {
  return String(s || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const m = /^(\d{1,2}[:.]\d{2})\s*[—–-]?\s*(.*)$/.exec(l);
    return m ? { t: m[1].replace(".", ":"), x: m[2] } : { t: "", x: l };
  });
}

/**
 * opts: { mode: "preview" | "live", slug, photoUrl(id), pf (id prefix) }
 */
// Venue line under the address: the common hall for everyone, plus the guest's own table on a personal link.
function seatLine(d, guest, T) {
  const seat = guest && guest.seat ? String(guest.seat) : "";
  if (!d.hall && !seat) return "";
  const parts = [d.hall, seat].filter(Boolean).map(esc).join(", ");
  return `<div class="hall">${seat ? `<span>${T.P("seat")}</span>` : ""}<b>${parts}</b></div>`;
}

// Sealed envelope shown before the invitation (live pages and demos). Tapping opens it and starts the music.
const SEAL = '<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M20 23C20 13 15 6 9 6C4 6 2 10 3.5 13C5 16 9.5 15.5 9.5 12.5C9.5 10.5 7.5 9.5 6.3 10.6M20 23C20 13 25 6 31 6C36 6 38 10 36.5 13C35 16 30.5 15.5 30.5 12.5C30.5 10.5 32.5 9.5 33.7 10.6M20 23V2M17 5L20 2L23 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function envelope(d, T, guest) {
  const who = names(d).replace('<span class="amp">&amp;</span>', " & ");
  return `<div class="env" data-act="open" role="button" tabindex="0" aria-label="${esc(T.P("env_tap"))}">
    <div class="env-in">
      <p class="env-for">${guest ? `<b class="env-guest">${esc(guest.name)}</b>` : ""}${T.L("env_for")}</p>
      <div class="env-box">
        <div class="env-back"></div>
        <div class="env-card"><span class="env-card-k">${T.type(d.type)}</span><b>${who}</b>${d.date ? `<span>${esc(numDate(d.date))}</span>` : ""}</div>
        <div class="env-pocket"></div>
        <div class="env-flap"><i></i></div>
        <span class="env-seal">${SEAL}</span>
      </div>
      <p class="env-tap">${T.L("env_tap")}</p>
    </div></div>`;
}

export function renderInvitation(d, opts = {}) {
  const T = mk(d.lang), pf = opts.pf || "inv";
  const photoUrl = opts.photoUrl || (id => `/media/${id}`);
  const pr = parseProg(d.prog);
  const q = encodeURIComponent(d.addr || d.venue || "");
  const ts = eventTs(d);
  const phone = d.phone && d.phone.replace(/\D/g, "").length >= 9 ? d.phone : "";
  const waNum = phone.replace(/\D/g, "");
  const guest = opts.guest || null;
  const dear = { ky: "Урматтуу", ru: "", both: "Урматтуу" }[d.lang] || "";
  return `<div class="${invClass(d.tpl, d.type)}" data-mode="${opts.mode || "preview"}" data-slug="${esc(opts.slug || "")}" data-lang="${d.lang}"${d.fx !== false ? ` data-fx="${d.type}"` : ""}${guest ? ` data-guest="${esc(guest.code)}"` : ""}>
  ${opts.envelope && d.env !== false ? envelope(d, T, guest) : ""}
  ${d.music ? `<button type="button" class="mus" data-act="music" data-track="${trackFile(d.track)}" aria-pressed="false" aria-label="${T.P("music")}">${NOTE}</button>` : ""}
  ${coverHTML(d, { photoUrl })}
  <section class="blk">${orn(d.tpl)}${guest ? `<p class="to">${dear ? `<span>${dear}</span>` : ""}<b>${esc(guest.name)}${d.lang === "ru" ? "," : "!"}</b></p>` : ""}<h2>${T.TT(d.type, "inv")}</h2>${d.msg ? `<p class="msg">${esc(d.msg)}</p>` : ""}
    ${d.hosts ? `<div class="hosts">${T.P("hosts")}<b>${esc(d.hosts)}</b></div>` : ""}</section>
  ${ts ? `<section class="blk"><h2>${T.TT(d.type, "cd")}</h2>
    <div class="cd" data-ts="${ts}" data-past="${esc(T.P("past"))}"><div><b data-u="d">0</b><span>${T.P("d")}</span></div><div><b data-u="h">0</b><span>${T.P("h")}</span></div><div><b data-u="m">0</b><span>${T.P("m")}</span></div><div><b data-u="s">0</b><span>${T.P("s")}</span></div></div>
    ${d.date ? `<div class="sub">${T.date(d.date)}</div>` : ""}</section>` : ""}
  ${pr.length ? `<section class="blk"><h2>${T.L("prog")}</h2><ul class="prog">${pr.map(i => `<li><time>${esc(i.t)}</time><span>${esc(i.x)}</span></li>`).join("")}</ul></section>` : ""}
  ${(d.venue || d.addr) ? `<section class="blk"><h2>${T.L("venue")}</h2>${d.venue ? `<div class="vn">${esc(d.venue)}</div>` : ""}${d.addr ? `<div class="ad">${esc(d.addr)}</div>` : ""}${seatLine(d, guest, T)}
    ${q ? `<div class="row2"><a class="ib f" href="https://2gis.kg/search/${q}" target="_blank" rel="noopener">2GIS</a><a class="ib" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">Google Maps</a></div>` : ""}</section>` : ""}
  ${d.dress ? `<section class="blk"><h2>${T.L("dress")}</h2><p class="msg">${esc(d.dress)}</p></section>` : ""}
  ${d.photos && d.photos.length ? `<section class="blk"><h2>${T.L("gal")}</h2><div class="gal">${d.photos.map(p => `<img src="${esc(photoUrl(p))}" alt="" loading="lazy" decoding="async" data-act="zoom">`).join("")}</div></section>` : ""}
  <section class="blk"><h2>${T.L("rsvp")}</h2>${d.dl ? `<div class="sub">${T.deadline(d.dl)}</div>` : ""}
    <form class="rsvp" data-pf="${pf}" novalidate>
      <label for="${pf}-rn">${T.P("rn")}</label><input type="text" id="${pf}-rn" name="name" autocomplete="name" maxlength="60" required${guest ? ` value="${esc(guest.name.slice(0, 60))}"` : ""}>
      <div class="yn" role="radiogroup"><label><input type="radio" name="att" id="${pf}-y" value="1" checked><span>${T.P("yes")}</span></label><label><input type="radio" name="att" id="${pf}-n" value="0"><span>${T.P("no")}</span></label></div>
      <div class="cntw"><label for="${pf}-rc">${T.P("cnt")}</label><input type="number" id="${pf}-rc" name="guests" min="1" max="20" value="1" inputmode="numeric"></div>
      <label for="${pf}-rt">${T.P("note")}</label><textarea id="${pf}-rt" name="note" maxlength="300"></textarea>
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="err" aria-live="polite" data-err="${esc(T.P("err"))}" data-fail="${esc(T.P("fail"))}" data-preview="${esc(T.P("preview"))}"></div>
      <button class="ib f" type="submit">${T.P("send")}</button>
    </form>
    <div class="thx" hidden>${T.L("thx")}</div>
  </section>
  ${phone ? `<section class="blk"><h2>${T.L("contact")}</h2><div class="row2"><a class="ib f" href="https://wa.me/${waNum}" target="_blank" rel="noopener">WhatsApp</a><a class="ib" href="tel:${esc(phone)}">${T.P("call")}</a></div><div class="sub">${esc(phone)}</div></section>` : ""}
  ${PREM.has(d.tpl) ? premFinale(d, premHelpers(d, T)) : ""}
  <footer class="ft"><a href="/" target="_blank" rel="noopener">${T.P("made")}</a></footer></div>`;
}
