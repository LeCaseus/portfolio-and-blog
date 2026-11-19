import { init_shell, init_specimen_viewers } from "/shared.js";

init_shell();
init_specimen_viewers(
  "/assets/thesis_massager.glb",
  false,
  '[data-specimen-viewer="massager"]',
);
init_specimen_viewers(
  "/assets/generic_laptop.glb",
  false,
  '[data-specimen-viewer="laptop"]',
);
