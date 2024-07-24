// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: calendar-alt;
const symbolsToTrack = ['AAPL', 'AMZN', 'MSFT', 'TSLA', 'META', 'NVDA', 'GOOGL', 'HOOD', 'NU', 'MELI','COIN','RIVN','SPOT','NFLX','RBLX','BRK.B'];
const widgetSize = 'large';
const MAX_DISPLAY_ITEMS = 11; // Changed from 14 to 11
const MELI_CUSTOM_LOGO = 'https://i.ibb.co/tzVQ2KH/Fey-Logo-1.png';

async function getLogoImage(symbol) {
  const logoUrl = symbol === 'MELI' ? MELI_CUSTOM_LOGO : `https://static.savvytrader.com/logos/${symbol}.webp`;
  const logoRequest = new Request(logoUrl);
  return await logoRequest.loadImage();
}

async function fetchEarningsData() {
  const today = new Date();
  const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  const url = `https://api.savvytrader.com/pricing/assets/earnings/calendar?start=${formatDate(today)}&end=${formatDate(endDate)}`;
  
  const request = new Request(url);
  const response = await request.loadJSON();
  
  return response
    .filter(item => symbolsToTrack.includes(item.symbol))
    .sort((a, b) => new Date(a.earningsDate) - new Date(b.earningsDate))
    .slice(0, MAX_DISPLAY_ITEMS); // This will now return only the first 11 items
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDDMM(dateString) {
  const date = new Date(dateString);
  // Adjust for local timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const day = localDate.getDate().toString().padStart(2, '0');
  const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}


function formatEPS(eps) {
  return eps.toFixed(2);
}

function daysUntil(dateString) {
  const now = new Date();
  const earningsDate = new Date(dateString);
  const diffTime = earningsDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function createWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1C1C1E");
  widget.setPadding(12, 16, 12, 16);
  
  // Title
  const titleStack = widget.addStack();
  const title = titleStack.addText("Upcoming Earnings");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();
  widget.addSpacer(10);
  
  // Create a stack for each earnings item
  for (const item of data) {
    const stack = widget.addStack();
    stack.spacing = 12;
    
    // Company logo
    const logoImage = await getLogoImage(item.symbol);
    const logoImageWidget = stack.addImage(logoImage);
    logoImageWidget.imageSize = new Size(16, 16);
    logoImageWidget.cornerRadius = 4;
    
    // Company info stack
    const infoStack = stack.addStack();
    infoStack.layoutHorizontally();
    
    const symbolText = infoStack.addText(item.symbol);
    symbolText.font = Font.mediumSystemFont(14);
    symbolText.textColor = Color.white();
    infoStack.addSpacer(6);
    const daysText = infoStack.addText(`${daysUntil(item.earningsDate)}d`);
    daysText.font = Font.systemFont(13);
    daysText.textColor = new Color("#ADADAD");
    infoStack.addSpacer(6);
    const dateText = infoStack.addText(formatDateDDMM(item.earningsDate));
    dateText.font = Font.systemFont(13);
    dateText.textColor = new Color("#ADADAD");
    
    infoStack.addSpacer(10);
    const epsText = infoStack.addText("• EPS " + formatEPS(item.epsEstimate));
    epsText.font = Font.systemFont(13);
    epsText.textColor = new Color("#ADADAD");
    
    infoStack.addSpacer(6);
    const revText = infoStack.addText("Rev " + Math.round(item.revenueEstimate / 1000000000).toLocaleString()+"B");
    revText.font = Font.systemFont(13);
    revText.textColor = new Color("#ADADAD");
    
    // Push content to the left
    stack.addSpacer();
    
    widget.addSpacer(8);
  }
  
  return widget;
}

async function run() {
  const data = await fetchEarningsData();
  const widget = await createWidget(data);
  
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentLarge();
  }
  
  Script.complete();
}

await run();
