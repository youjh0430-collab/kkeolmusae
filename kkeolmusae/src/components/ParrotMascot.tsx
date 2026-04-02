import Image from "next/image";

type MascotVariant = 'full' | 'face' | 'avatar';

export default function ParrotMascot({ 
  className = "", 
  emotion = 'default',
  variant = 'avatar' // 기본값을 깔끔한 원형 프레임으로 변경하여 사각형 테두리를 없앱니다.
}: { 
  className?: string, 
  emotion?: 'default' | 'sad' | 'excited' | 'mocking',
  variant?: MascotVariant
}) {

  let containerStyle = "";
  let imageStyle = "";
  
  // 상황에 따른 마스코트 렌더링 방식 분기
  switch (variant) {
    case 'face':
      // 1. 얼굴만 초근접 줌인 (결과 페이지 코멘트용 등)
      containerStyle = "w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-white";
      imageStyle = "object-cover scale-[2.0] origin-[50%_25%]"; 
      break;
    case 'avatar':
      // 2. 아바타 모드: 사각형이 안 보이게 둥근 프레임 안으로 마스킹 (메인 화면용)
      containerStyle = "w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-emerald-50 shadow-md bg-white hover:border-primary transition-colors";
      imageStyle = "object-cover scale-[1.1] origin-[50%_35%]";
      break;
    case 'full':
    default:
      // 3. 전신 모드 (배경이 투명할 때 사용)
      containerStyle = "w-32 h-32 md:w-48 md:h-48 drop-shadow-xl";
      imageStyle = "object-contain mix-blend-multiply";
      break;
  }

  return (
    <div className={`relative flex items-center justify-center ${className} transition-transform hover:scale-105 hover:-rotate-3 duration-300 cursor-pointer`}>
      <div className={`relative flex items-center justify-center ${containerStyle}`}>
        <Image
          src="/mascot-smug-3d.png"
          alt={`껄무새 (${emotion})`}
          fill
          className={`${imageStyle} transition-all duration-300 hover:scale-125`}
          priority
        />
      </div>
    </div>
  );
}
