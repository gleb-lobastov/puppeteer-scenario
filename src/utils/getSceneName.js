export default function getSceneName(scene) {
  return scene?.constructor?.name || (scene ? "unknown scene" : "no scene");
}
