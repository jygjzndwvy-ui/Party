// ─────────────────────────────────────────────────────────────────────────────
//  ОБЪЕКТЫ КАТАЛОГА
//  Сейчас здесь демо-объекты, чтобы каталог, фильтры и карточки было видно
//  в работе. Замените их своими или подключите выгрузку из CRM
//  (Home CRM, Битрикс24, Joy Work): структура полей описана в README.
//
//  Поля объекта:
//    id        уникальный номер (строка), попадает в адрес страницы
//    deal      'sale' продажа | 'rent' аренда
//    type      'flat' квартира | 'studio' студия | 'house' дом | 'commercial' помещение
//    rooms     число комнат (для студии 0)
//    area      общая площадь, м²        kitchen  площадь кухни, м²
//    floor     этаж                     floors   этажей в доме
//    price     цена, ₽ (для аренды: в месяц)
//    district  район                    address  улица и дом
//    year      год постройки
//    tour      true: есть 3D-тур        tourUrl  ссылка на тур (Matterport и т. п.)
//    showing   true: доступен онлайн-показ по коду доступа
//    checked   true: объект прошёл юридическую проверку
//    isNew     true: метка «Новое»
//    features  особенности списком
//    text      описание
//    photos    ссылки на фото; пока пусто, сайт рисует иллюстрации сам
//    plan      планировка для схемы: 'studio' | 'one' | 'two' | 'three'
//    scenes    какие иллюстрации показывать, пока нет фото
//    palette   цвет иллюстраций: blue | sand | sage | night | rose | sky
// ─────────────────────────────────────────────────────────────────────────────

export const districts = ['Центральный', 'Северный', 'Приречный', 'Заречный', 'Парковый'];

export const objects = [
  {
    id: '1001', deal: 'sale', type: 'flat', rooms: 2, area: 54.2, kitchen: 11.4, floor: 7, floors: 16, price: 12400000,
    district: 'Центральный', address: 'ул. Садовая, 12', year: 2018, tour: true, showing: true, checked: true, isNew: true,
    features: ['Балкон', 'Раздельный санузел', 'Кухонный гарнитур', 'Консьерж', 'Подземный паркинг'],
    text: 'Светлая двухкомнатная квартира с окнами на две стороны. Свежий ремонт, встроенная кухня остаётся покупателю. Один собственник, документы готовы к сделке.',
    photos: [], plan: 'two', scenes: ['living', 'kitchen', 'bedroom'], palette: 'blue',
  },
  {
    id: '1002', deal: 'sale', type: 'studio', rooms: 0, area: 28.6, kitchen: 0, floor: 12, floors: 25, price: 6900000,
    district: 'Северный', address: 'пр. Мира, 48', year: 2022, tour: true, showing: true, checked: true, isNew: false,
    features: ['Панорамные окна', 'Отделка от застройщика', 'Кладовая', 'Двор без машин'],
    text: 'Компактная студия в новом доме. Подойдёт для первой собственной квартиры или под сдачу. Ключи в кодовом боксе: посмотреть можно в любой день.',
    photos: [], plan: 'studio', scenes: ['studio', 'kitchen'], palette: 'sky',
  },
  {
    id: '1003', deal: 'sale', type: 'flat', rooms: 3, area: 82.5, kitchen: 14, floor: 4, floors: 9, price: 18900000,
    district: 'Парковый', address: 'ул. Лесная, 7', year: 2011, tour: true, showing: false, checked: true, isNew: false,
    features: ['Два санузла', 'Гардеробная', 'Лоджия', 'Вид на парк', 'Мебель по договорённости'],
    text: 'Трёхкомнатная квартира для семьи рядом с парком. Изолированные комнаты, большая кухня-гостиная, тихий зелёный двор.',
    photos: [], plan: 'three', scenes: ['living', 'bedroom', 'kitchen'], palette: 'sage',
  },
  {
    id: '1004', deal: 'sale', type: 'flat', rooms: 1, area: 38.9, kitchen: 9.2, floor: 2, floors: 5, price: 7800000,
    district: 'Заречный', address: 'ул. Речная, 31', year: 1987, tour: false, showing: true, checked: true, isNew: false,
    features: ['Кирпичный дом', 'Балкон', 'Свободная продажа'],
    text: 'Однокомнатная квартира в кирпичном доме. Чистая продажа, никто не прописан. Показываем по одноразовому коду без участия собственника.',
    photos: [], plan: 'one', scenes: ['living', 'kitchen'], palette: 'sand',
  },
  {
    id: '1005', deal: 'sale', type: 'house', rooms: 4, area: 146, kitchen: 18, floor: 2, floors: 2, price: 24500000,
    district: 'Приречный', address: 'пос. Сосновый, ул. Тихая, 5', year: 2019, tour: true, showing: false, checked: true, isNew: true,
    features: ['Участок 8 соток', 'Газ', 'Тёплый пол', 'Гараж на 2 машины', 'Терраса'],
    text: 'Двухэтажный дом для постоянного проживания. Центральные коммуникации, асфальт до участка, 15 минут до города.',
    photos: [], plan: 'three', scenes: ['house', 'living', 'bedroom'], palette: 'rose',
  },
  {
    id: '1006', deal: 'sale', type: 'flat', rooms: 2, area: 61.3, kitchen: 12.5, floor: 15, floors: 22, price: 14200000,
    district: 'Северный', address: 'ул. Новая, 3', year: 2020, tour: true, showing: true, checked: false, isNew: false,
    features: ['Вид на город', 'Кондиционеры', 'Встроенные шкафы', 'Охраняемая территория'],
    text: 'Двухкомнатная квартира на высоком этаже. Дизайнерский ремонт, вся техника остаётся. Юридическая проверка в работе.',
    photos: [], plan: 'two', scenes: ['living', 'bedroom', 'kitchen'], palette: 'night',
  },
  {
    id: '1007', deal: 'sale', type: 'commercial', rooms: 0, area: 96, kitchen: 0, floor: 1, floors: 12, price: 21000000,
    district: 'Центральный', address: 'ул. Торговая, 20', year: 2016, tour: false, showing: true, checked: true, isNew: false,
    features: ['Первая линия', 'Отдельный вход', 'Витринные окна', 'Мощность 25 кВт'],
    text: 'Помещение свободного назначения на первой линии. Высокий пешеходный трафик, подойдёт под магазин, кафе или офис.',
    photos: [], plan: 'studio', scenes: ['shop', 'studio'], palette: 'blue',
  },
  {
    id: '1008', deal: 'sale', type: 'flat', rooms: 1, area: 42, kitchen: 10.8, floor: 9, floors: 17, price: 8600000,
    district: 'Парковый', address: 'ул. Кленовая, 14', year: 2015, tour: false, showing: false, checked: true, isNew: false,
    features: ['Лоджия', 'Натяжные потолки', 'Рядом школа и детский сад'],
    text: 'Уютная однокомнатная квартира в обжитом районе. Развитая инфраструктура, до парка 5 минут пешком.',
    photos: [], plan: 'one', scenes: ['bedroom', 'kitchen'], palette: 'rose',
  },
  {
    id: '1009', deal: 'sale', type: 'flat', rooms: 3, area: 94.7, kitchen: 16.2, floor: 20, floors: 24, price: 27300000,
    district: 'Приречный', address: 'наб. Речная, 2', year: 2023, tour: true, showing: true, checked: true, isNew: true,
    features: ['Вид на реку', 'Потолки 3 метра', 'Мастер-спальня', 'Два паркоместа', 'Умный дом'],
    text: 'Видовая трёхкомнатная квартира на набережной. Панорамное остекление, качественная отделка, закрытая территория.',
    photos: [], plan: 'three', scenes: ['living', 'kitchen', 'bedroom'], palette: 'sky',
  },
  // ── Аренда ──
  {
    id: '2001', deal: 'rent', type: 'flat', rooms: 1, area: 36.5, kitchen: 9, floor: 5, floors: 10, price: 42000,
    district: 'Центральный', address: 'ул. Садовая, 40', year: 2014, tour: true, showing: true, checked: true, isNew: true,
    features: ['Можно с детьми', 'Стиральная машина', 'Интернет', 'Онлайн-заселение'],
    text: 'Однокомнатная квартира с мебелью и техникой. Заселение онлайн: договор в приложении, платежи списываются автоматически.',
    photos: [], plan: 'one', scenes: ['living', 'kitchen'], palette: 'sand',
  },
  {
    id: '2002', deal: 'rent', type: 'studio', rooms: 0, area: 24, kitchen: 0, floor: 8, floors: 19, price: 31000,
    district: 'Северный', address: 'пр. Мира, 52', year: 2021, tour: true, showing: true, checked: true, isNew: false,
    features: ['Новый ремонт', 'Посудомоечная машина', 'Кондиционер', 'Онлайн-заселение'],
    text: 'Студия в новом доме для одного или пары. Всё необходимое уже есть, заезжайте с чемоданом.',
    photos: [], plan: 'studio', scenes: ['studio', 'kitchen'], palette: 'sage',
  },
  {
    id: '2003', deal: 'rent', type: 'flat', rooms: 2, area: 58, kitchen: 12, floor: 3, floors: 9, price: 58000,
    district: 'Парковый', address: 'ул. Лесная, 19', year: 2009, tour: true, showing: false, checked: true, isNew: false,
    features: ['Можно с животными', 'Два балкона', 'Парковка во дворе'],
    text: 'Двухкомнатная квартира для семьи рядом с парком. Собственник проверен, имущество застраховано.',
    photos: [], plan: 'two', scenes: ['living', 'bedroom', 'kitchen'], palette: 'blue',
  },
  {
    id: '2004', deal: 'rent', type: 'flat', rooms: 3, area: 88, kitchen: 15, floor: 11, floors: 16, price: 95000,
    district: 'Приречный', address: 'наб. Речная, 8', year: 2020, tour: true, showing: true, checked: true, isNew: false,
    features: ['Вид на реку', 'Два санузла', 'Подземный паркинг', 'Онлайн-заселение'],
    text: 'Просторная трёхкомнатная квартира с видом на воду. Полностью меблирована, техника премиального уровня.',
    photos: [], plan: 'three', scenes: ['living', 'kitchen', 'bedroom'], palette: 'night',
  },
  {
    id: '2005', deal: 'rent', type: 'flat', rooms: 1, area: 40.2, kitchen: 10, floor: 6, floors: 12, price: 38000,
    district: 'Заречный', address: 'ул. Речная, 44', year: 2012, tour: false, showing: true, checked: false, isNew: false,
    features: ['Балкон', 'Мебель', 'Рядом остановка'],
    text: 'Однокомнатная квартира в спокойном районе. Показ по одноразовому коду в удобное время.',
    photos: [], plan: 'one', scenes: ['bedroom', 'living'], palette: 'sky',
  },
  {
    id: '2006', deal: 'rent', type: 'commercial', rooms: 0, area: 64, kitchen: 0, floor: 1, floors: 5, price: 120000,
    district: 'Центральный', address: 'ул. Торговая, 9', year: 2005, tour: false, showing: true, checked: true, isNew: false,
    features: ['Отдельный вход', 'Витрина', 'Санузел', 'Мокрая точка'],
    text: 'Торговое помещение на оживлённой улице. Подойдёт под магазин, салон или пункт выдачи.',
    photos: [], plan: 'studio', scenes: ['shop', 'studio'], palette: 'sand',
  },
  {
    id: '2007', deal: 'rent', type: 'house', rooms: 3, area: 120, kitchen: 16, floor: 2, floors: 2, price: 110000,
    district: 'Парковый', address: 'пос. Берёзовый, ул. Луговая, 11', year: 2017, tour: true, showing: false, checked: true, isNew: true,
    features: ['Участок 6 соток', 'Баня', 'Камин', 'Можно с животными'],
    text: 'Дом для жизни за городом на длительный срок. Тёплый, с мебелью, хорошие соседи и охрана на въезде.',
    photos: [], plan: 'three', scenes: ['house', 'living', 'bedroom'], palette: 'sage',
  },
];
