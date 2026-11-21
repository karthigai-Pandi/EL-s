import Image from "next/image";

export function StudioLogo({ light = false }: { light?: boolean }) {
  return <Image className="studio-logo" src={light ? "/els-studio-logo-light.svg" : "/els-studio-logo.svg"} alt="EL's Studio" width={140} height={92} priority />;
}