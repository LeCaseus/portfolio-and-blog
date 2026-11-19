import {
  init_shell,
  init_typewriter,
  init_specimen_viewers,
  init_relative_timestamps,
} from "/shared.js";

init_shell();
init_typewriter();
init_specimen_viewers("/assets/exploded-skull.glb", true);
init_relative_timestamps();
