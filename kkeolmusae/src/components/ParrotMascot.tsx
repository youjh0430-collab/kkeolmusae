export default function ParrotMascot({ className = "", emotion = 'default' }: { className?: string, emotion?: 'default' | 'sad' | 'excited' | 'mocking' }) {
  // 실제 이미지 에셋이 나오기 전까지 이모지로 임시 구현
  const getEmoji = () => {
    switch (emotion) {
      case 'excited': return '🦜💸';
      case 'sad': return '🦜☔';
      case 'mocking': return '🦜🤪';
      default: return '🦜';
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-5xl shadow-sm border-2 border-primary">
        {getEmoji()}
      </div>
    </div>
  );
}
