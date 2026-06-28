import { BRAND } from "./scene-constants";

export function SceneLighting() {
  return (
    <>
      <color attach="background" args={[BRAND.beige]} />
      <fog attach="fog" args={[BRAND.beigeDark, 32, 115]} />
      <ambientLight intensity={1.15} color="#FFF8F0" />
      <hemisphereLight args={["#FFFFFF", BRAND.beigeDark, 0.65]} />
      <directionalLight position={[8, 16, 12]} intensity={0.95} color="#FFF8F0" castShadow={false} />
      <directionalLight position={[-8, 12, -20]} intensity={0.45} color={BRAND.orange} />
      {/* Orange rim accents along the scroll path */}
      <pointLight position={[0, 10, -18]} intensity={0.4} color={BRAND.orangeLight} distance={70} decay={2} />
      <pointLight position={[-14, 6, -48]} intensity={0.3} color={BRAND.glow} distance={55} decay={2} />
      <pointLight position={[14, 8, -72]} intensity={0.28} color={BRAND.orange} distance={55} decay={2} />
      <pointLight position={[0, 12, -96]} intensity={0.22} color={BRAND.gold} distance={60} decay={2} />
      <pointLight position={[-10, 5, -108]} intensity={0.2} color={BRAND.orangeLight} distance={50} decay={2} />
    </>
  );
}

export function HeroSceneLighting() {
  return (
    <>
      <color attach="background" args={[BRAND.beige]} />
      <fog attach="fog" args={[BRAND.beigeDark, 20, 58]} />
      <ambientLight intensity={1.2} color="#FFF8F0" />
      <hemisphereLight args={["#FFFFFF", BRAND.beigeDark, 0.7]} />
      <directionalLight position={[6, 14, 10]} intensity={0.9} color="#FFF8F0" />
      <directionalLight position={[-5, 10, -6]} intensity={0.45} color={BRAND.orange} />
      <pointLight position={[5, 8, -6]} intensity={0.5} color={BRAND.orangeLight} distance={42} decay={2} />
      <pointLight position={[-7, 5, -10]} intensity={0.35} color={BRAND.glow} distance={38} decay={2} />
      <pointLight position={[0, 14, -4]} intensity={0.25} color={BRAND.gold} distance={35} decay={2} />
    </>
  );
}
