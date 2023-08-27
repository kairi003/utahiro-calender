// Required Properties: CALENDER_ID, KEY_HASH
// Key Hash: echo -n ${SECRET_KEY} | sha256sum

function doPost(e) {
  if (!e) throw new Error(`Invalid arguments`);

  const props = PropertiesService.getScriptProperties();
  const KEY_HASH = props.getProperty('KEY_HASH');
  
  try {
    const data = JSON.parse(e.postData.contents);
    const {key, content: {title, date}} = data;
    if (hash(key) !== KEY_HASH) throw new Error(`Invalid key`);
    const message = addEventIfNotExists(title, date);
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ status: "success", message}));
    return output;
  } catch(err) {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ status: "failed", message: err.toString()}));
    return output;
  }
}

function hash(key) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key);
  const hexHash = bytes.map(b=>(b&0xFF).toString(16).padStart(2,0)).join('');
  return hexHash;
}

function addEventIfNotExists(title, dateSrc) {
  if (!title || !dateSrc) throw new Error(`Invalid arguments`);

  const props = PropertiesService.getScriptProperties();
  const CALENDER_ID = props.getProperty('CALENDER_ID');
  const calendar = CalendarApp.getCalendarById(CALENDER_ID);
  const date = new Date(dateSrc);
  const existings = calendar.getEventsForDay(date);
  const duplicates = existings.filter(e => e.getTitle() === title);
  if (duplicates.length > 0) return 'DUPLICATE_EVENT';
  calendar.createAllDayEvent(title, date);
  console.log(`create ${date.toLocaleDateString()} event`);
  return 'CREATE_EVENT';
}
