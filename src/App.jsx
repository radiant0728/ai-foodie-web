/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from 'react';

// --- Global Constants ---
const PAGES = {
  AUTH: 'auth',        // 로그인/회원가입 화면
  HOME: 'home',        // 메인 대시보드
  SCAN: 'scan',        // 카메라/스캔
  HISTORY: 'history',  // 기록 보관함
  ALLERGIES: 'allergies',
  INFO: 'info',
  LOADING: 'loading',
  RESULT: 'result',
};

const ALLERGEN_OPTIONS = [
  '우유', '땅콩', '밀', '계란', '대두', '견과류', '새우', '게', '복숭아', '토마토'
];

/* =========================================================================
 * SUB-COMPONENTS
 * ========================================================================= */

// 1. [NEW] 자체 회원가입/로그인 컴포넌트
const AuthView = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // true: 로그인, false: 회원가입
  
  // 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // 회원가입 시에만 사용
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!email || !password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (!isLoginMode && !name) {
      setError('이름을 입력해주세요.');
      return;
    }

    // 상위 컴포넌트로 데이터 전달
    const success = onLogin(isLoginMode, { email, password, name });
    if (!success) {
      setError(isLoginMode ? '아이디 또는 비밀번호가 틀렸습니다.' : '이미 존재하는 이메일입니다.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-gray-900 p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-violet-400 font-sans-kr">AI-Foodie</h1>
        <p className="text-gray-400 font-sans-kr">
          {isLoginMode ? '나만의 알레르기 주치의' : '새로운 계정 만들기'}
        </p>
      </div>

      <div className="w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 회원가입일 때만 이름 입력 */}
          {!isLoginMode && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">이름</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-violet-500 outline-none"
                placeholder="홍길동"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">이메일</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-violet-500 outline-none"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-violet-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-lg bg-violet-600 text-white font-bold text-lg hover:bg-violet-700 transition shadow-lg mt-4"
          >
            {isLoginMode ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </p>
          <button 
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
            className="text-violet-400 font-bold hover:underline text-sm mt-1"
          >
            {isLoginMode ? '회원가입 하러가기' : '로그인 하러가기'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. 기록 보관함
const HistoryView = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="text-4xl mb-4">📂</div>
        <p>저장된 분석 기록이 없습니다.</p>
        <p className="text-sm">첫 스캔을 시작해보세요!</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 space-y-6 bg-gray-900 min-h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-white font-sans-kr">📋 나의 분석 기록</h2>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center p-4 bg-gray-700/30 border-b border-gray-700">
              <span className="text-gray-300 text-sm font-sans-kr">
                {new Date(item.timestamp).toLocaleDateString()} <span className="text-gray-500">|</span> {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'SAFE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {item.status === 'SAFE' ? '안전' : '위험'}
              </span>
            </div>
            <div className="p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-2xl border border-gray-600">
                {item.status === 'SAFE' ? '🥦' : '🥜'}
              </div>
              <div className="flex-1">
                 <h3 className="text-white font-bold mb-1 font-sans-kr">{item.message}</h3>
                 {item.detail && (
                   <p className="text-xs text-gray-400">검출: {item.detail.join(', ')}</p>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. 결과 표시 및 카메라
const ResultDisplay = ({ result, onRestart }) => {
  const { status, message, detail } = result;
  const colorMap = {
    SAFE: { bg: 'bg-green-600', text: 'text-gray-100', icon: '✅' },
    CAUTION: { bg: 'bg-yellow-600', text: 'text-gray-900', icon: '⚠️' },
    DANGER: { bg: 'bg-red-600', text: 'text-gray-100', icon: '❌' },
  };
  const { bg, text, icon } = colorMap[status] || colorMap.SAFE;

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-6 rounded-xl ${bg} shadow-2xl mx-auto w-full max-w-md mt-10`}>
      <div className="text-6xl">{icon}</div>
      <h1 className={`text-3xl font-extrabold ${text} text-center`}>
        {status === 'SAFE' ? '안전' : '위험'}
      </h1>
      <p className={`text-xl text-gray-200 text-center`}>{message}</p>
      
      {detail && (
         <div className="bg-black/20 p-4 rounded-lg w-full">
            <p className="text-sm font-bold text-white mb-1">검출 성분:</p>
            <p className="text-sm text-gray-200">{detail.join(', ')}</p>
         </div>
      )}

      <button onClick={onRestart} className="mt-8 w-full py-3 bg-white text-gray-900 font-bold rounded-xl shadow-lg">
        확인 (저장됨)
      </button>
    </div>
  );
};

const CameraInput = ({ onScan }) => {
  const fileInputRef = useRef(null);
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full bg-gray-900 text-white min-h-[60vh]">
      <div 
        onClick={() => fileInputRef.current.click()} 
        className="w-full max-w-xs cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed border-violet-700 rounded-2xl bg-gray-800 hover:bg-gray-700 transition"
      >
        <div className="text-5xl mb-4">📸</div>
        <span className="text-xl font-bold">성분표 촬영하기</span>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onScan(e.target.files[0])} />
      </div>
      <button onClick={() => onScan(null)} className="text-gray-500 underline text-sm">
        (테스트: 카메라 없이 바로 결과 보기)
      </button>
    </div>
  );
};

const AllergySelector = ({ selectedAllergies, onSelectionChange, onSave }) => {
  const handleToggle = (a) => {
    if (selectedAllergies.includes(a)) onSelectionChange(selectedAllergies.filter(i => i !== a));
    else onSelectionChange([...selectedAllergies, a]);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold text-violet-400">알레르기 정보 설정</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALLERGEN_OPTIONS.map((item) => (
          <div 
            key={item} 
            onClick={() => handleToggle(item)}
            className={`p-3 rounded-lg cursor-pointer font-bold text-center transition ${selectedAllergies.includes(item) ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {item}
          </div>
        ))}
      </div>
      <button onClick={onSave} className="w-full py-3 bg-violet-600 rounded-xl font-bold">저장하기</button>
    </div>
  );
};

/* =========================================================================
 * MAIN APP
 * ========================================================================= */

const App = () => {
  const [currentUser, setCurrentUser] = useState(null); 
  const [currentPage, setCurrentPage] = useState(PAGES.AUTH);
  const [scanState, setScanState] = useState(PAGES.CAMERA);
  const [scanResult, setScanResult] = useState(null);

  // 현재 로그인한 유저의 데이터
  const [userAllergies, setUserAllergies] = useState([]);
  const [history, setHistory] = useState([]);

  // --- 1. 로그인/회원가입 로직 (LocalStorage 사용) ---
  const handleAuth = (isLogin, data) => {
    const { email, password, name } = data;
    
    // 로컬 스토리지에서 전체 유저 목록 불러오기
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');

    if (isLogin) {
      // [로그인 로직]
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        loginUser(foundUser);
        return true;
      }
      return false; // 로그인 실패
    } else {
      // [회원가입 로직]
      if (users.some(u => u.email === email)) {
        return false; // 이미 존재하는 이메일
      }
      const newUser = { id: Date.now().toString(), email, password, name };
      const updatedUsers = [...users, newUser];
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      
      loginUser(newUser); // 가입 후 자동 로그인
      return true;
    }
  };

  const loginUser = (user) => {
    setCurrentUser(user);
    // 로그인 시 해당 유저의 데이터 로드
    loadUserData(user.id);
    setCurrentPage(PAGES.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHistory([]);
    setUserAllergies([]);
    setCurrentPage(PAGES.AUTH);
  };

  // --- 2. 데이터 관리 (유저별 분리 저장) ---
  
  // 유저 데이터 로드 함수
  const loadUserData = (userId) => {
    const savedAllergies = JSON.parse(localStorage.getItem(`allergies_${userId}`) || '[]');
    const savedHistory = JSON.parse(localStorage.getItem(`history_${userId}`) || '[]');
    setUserAllergies(savedAllergies);
    setHistory(savedHistory);
  };

  // 유저 데이터 저장 (상태가 변경될 때마다 자동 저장)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`allergies_${currentUser.id}`, JSON.stringify(userAllergies));
    }
  }, [userAllergies, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(history));
    }
  }, [history, currentUser]);


  // --- 3. 스캔 및 판정 로직 ---
  const processScan = async (file) => {
    setScanState(PAGES.LOADING);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 판정
    const isDanger = userAllergies.some(a => ['땅콩', '새우', '게', '복숭아'].includes(a));
    const resultData = isDanger 
      ? { status: 'DANGER', message: '🚨 설정하신 위험 성분이 감지되었습니다!', detail: ['해당 알러지원 추출물'] }
      : { status: 'SAFE', message: '✅ 알레르기 성분이 발견되지 않았습니다.', detail: null };

    setScanResult(resultData);
    setScanState(PAGES.RESULT);

    // 기록 추가 (최신순)
    if (currentUser) {
      const newRecord = {
        id: Date.now(),
        timestamp: Date.now(),
        ...resultData
      };
      setHistory(prev => [newRecord, ...prev]);
    }
  };

  // --- 렌더링 ---
  if (!currentUser) {
    return <AuthView onLogin={handleAuth} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.HOME:
        return (
          <div className="p-8 space-y-8 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 rounded-2xl shadow-lg">
              <h1 className="text-2xl font-bold mb-2">반갑습니다, {currentUser.name}님!</h1>
              <p className="text-violet-100 text-sm">현재 {userAllergies.length}개의 알레르기를 관리 중입니다.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCurrentPage(PAGES.SCAN)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg">
                <span className="text-4xl mb-2">📸</span>
                <span className="font-bold">성분 스캔</span>
              </button>
              <button onClick={() => setCurrentPage(PAGES.HISTORY)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg">
                <span className="text-4xl mb-2">📂</span>
                <span className="font-bold">분석 기록</span>
              </button>
            </div>

            {/* 홈 화면 위젯: 최근 기록 미리보기 */}
            <div className="mt-4">
              <h3 className="text-lg font-bold text-gray-400 mb-2">최근 활동</h3>
              {history.length > 0 ? (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                   <span>{history[0].message}</span>
                   <span className="text-xs text-gray-500">방금 전</span>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">아직 기록이 없습니다.</p>
              )}
            </div>
          </div>
        );
      case PAGES.SCAN:
        switch (scanState) {
          case PAGES.CAMERA: return <CameraInput onScan={processScan} />;
          case PAGES.LOADING: return <div className="text-white text-center mt-20 text-xl font-bold animate-pulse">AI 분석중... 🔄</div>;
          case PAGES.RESULT: return <ResultDisplay result={scanResult} onRestart={() => { setScanResult(null); setScanState(PAGES.CAMERA); }} />;
        }
        break;
      case PAGES.HISTORY:
        return <HistoryView history={history} />;
      case PAGES.ALLERGIES:
        return <AllergySelector selectedAllergies={userAllergies} onSelectionChange={setUserAllergies} onSave={() => setCurrentPage(PAGES.HOME)} />;
      case PAGES.INFO:
        return (
          <div className="p-8 text-white text-center space-y-6">
            <h1 className="text-2xl font-bold">내 정보 (My Page)</h1>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="w-20 h-20 bg-violet-500 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4">
                {currentUser.name[0]}
              </div>
              <p className="text-xl font-bold">{currentUser.name}</p>
              <p className="text-gray-400 text-sm">{currentUser.email}</p>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => setCurrentPage(PAGES.ALLERGIES)} className="w-full py-3 bg-gray-800 rounded-lg text-sm font-bold border border-gray-700">
                알레르기 설정 변경
              </button>
              <button onClick={handleLogout} className="w-full py-3 bg-red-900/30 text-red-400 border border-red-900 rounded-lg text-sm font-bold">
                로그아웃
              </button>
            </div>
          </div>
        );
      default: return <div>Error</div>;
    }
  };

  const navItems = [
    { page: PAGES.HOME, icon: '🏠', label: '홈' },
    { page: PAGES.SCAN, icon: '🔍', label: '스캔' },
    { page: PAGES.HISTORY, icon: '📂', label: '기록' },
    { page: PAGES.ALLERGIES, icon: '⚙️', label: '설정' },
    { page: PAGES.INFO, icon: '👤', label: 'MY' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center font-sans-kr">
      <style>{`@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css'); .font-sans-kr { font-family: Pretendard, sans-serif; }`}</style>
      
      <div className="w-full max-w-lg bg-gray-900 shadow-2xl flex flex-col border-x border-gray-800 relative">
        {currentUser && (
          <nav className="w-full bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50 py-4 px-6 flex justify-between items-center">
            <span className="text-violet-400 font-extrabold text-xl cursor-pointer" onClick={() => setCurrentPage(PAGES.HOME)}>AI-Foodie</span>
            <span className="text-xs text-gray-400">{currentUser.name}님</span>
          </nav>
        )}

        <main className="flex-grow">
          {renderContent()}
        </main>

        {currentUser && (
          <footer className="bg-gray-900 border-t border-gray-800 sticky bottom-0 z-10 flex justify-around py-3">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`flex flex-col items-center text-xs font-bold transition ${currentPage === item.page ? 'text-violet-400' : 'text-gray-600'}`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;