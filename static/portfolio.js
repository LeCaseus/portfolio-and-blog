import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, init_typewriter, init_specimen_viewers } from '/shared.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();
init_typewriter();

init_specimen_viewers('/assets/thesis_massager.glb', false);
