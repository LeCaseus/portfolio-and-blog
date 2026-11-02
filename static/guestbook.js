import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav } from '/shared.js';
import { loadMessages, initMessageForm, initCharCounter } from '/messages.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();

const guestbookPage = 'guestbook';
const charCountElement = document.querySelector('[data-gb-count]');

initCharCounter(document.getElementById('gb-message'), charCountElement);

initMessageForm({
  page: guestbookPage,
  form: document.querySelector('[data-gb-form]'),
  submitButton: document.querySelector('[data-gb-submit]'),
  statusElement: document.querySelector('[data-gb-status]'),
  charCountElement,
  successText: 'sent — pending approval, thanks for signing.'
});

loadMessages({
  page: guestbookPage,
  listElement: document.querySelector('[data-gb-entries]'),
  entryCountElement: document.querySelector('[data-gb-entry-count]'),
  emptyText: 'no entries yet — be the first.'
});
