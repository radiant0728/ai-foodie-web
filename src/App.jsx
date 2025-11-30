/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from 'react';

// --- Global Constants ---
const PAGES = {
  AUTH: 'auth',        // 로그인/회원가입
  HOME: 'home',        // 메인 홈
  SCAN: 'scan',        // 카메라
  HISTORY: 'history',  // 기록
  ALLERGIES: 'allergies',
  INFO: 'info',        // 마이페이지
  LOADING: 'loading',
  RESULT: 'result',
};

const ALLERGEN_OPTIONS = [
  '우유', '땅콩', '밀', '계란', '대두', '견과류', '새우', '게', '복숭아', '토마토'
];

/* =========================================================================
 * 유틸리티: 이미지 압축 및 Base64 변환 (오프라인 저장용 핵심 기술)
 * ========================================================================= */
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 캔버스 생성 (너비 300px로 리사이징하여 용량 최적화)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // JPEG 포맷, 품질 0.7로 변환 (용량 대폭 감소)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
    };
  });
};

/* =========================================================================
 * 1. 인증(로그인/회원가입) 화면
 * ========================================================================= */
const AuthView = ({ onAuth }) => {
  const [activeTab, setActiveTab] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(''); setEmail(''); setPassword(''); setName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.');
    if (activeTab === 'signup' && !name) return setError('이름을 입력해주세요.');

    // [버그 수정됨] activeTab 문자열이 아닌, true/false 값을 전달
    const isLoginMode = (activeTab === 'login');
    const success = onAuth(isLoginMode, { email, password, name });
    
    if (!success) {
      setError(isLoginMode ? '아이디 또는 비밀번호가 틀렸습니다.' : '이미 사용 중인 이메일입니다.');
    }
  };

  const handleResetData = () => {
    if (window.confirm('모든 데이터를 삭제하고 초기화하시겠습니까? (복구 불가)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-sans-kr mb-2">AI-Foodie</h1>
        <p className="text-gray-400 font-sans-kr text-sm">오프라인에서도 안전한 식생활</p>
      </div>

      <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button onClick={() => handleTabChange('login')} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'login' ? 'text-violet-400 border-b-2 border-violet-400 bg-gray-800' : 'text-gray-500 bg-gray-900'}`}>로그인</button>
          <button onClick={() => handleTabChange('signup')} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'signup' ? 'text-violet-400 border-b-2 border-violet-400 bg-gray-800' : 'text-gray-500 bg-gray-900'}`}>회원가입</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {activeTab === 'signup' && (
            <input type="text" placeholder="이름 (예: 홍길동)" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          )}
          <input type="email" placeholder="이메일 (예: test@email.com)" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          <input type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          
          {error && <p className="text-red-400 text-sm text-center font-bold animate-pulse">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-lg bg-violet-600 text-white font-bold hover:bg-violet-700 transition mt-2 shadow-lg">
            {activeTab === 'login' ? '시작하기' : '회원가입 완료'}
          </button>
        </form>
      </div>

      <button onClick={handleResetData} className="mt-8 text-xs text-gray-500 border border-gray-700 px-3 py-2 rounded hover:text-red-400 hover:border-red-400 transition">
        🗑️ 테스트 데이터 전체 초기화
      </button>
    </div>
  );
};

/* =========================================================================
 * 2. 기록 보관함 (이미지 렌더링)
 * ========================================================================= */
const HistoryView = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="text-5xl mb-4 opacity-50">📂</div>
        <p>아직 저장된 기록이 없습니다.</p>
        <p className="text-sm mt-2">첫 스캔을 시작해보세요!</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 space-y-6 bg-gray-900 min-h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-white font-sans-kr">📸 나의 분석 앨범</h2>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col hover:border-violet-500 transition duration-200">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 border-b border-gray-700">
              <span className="text-gray-300 text-xs">
                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'SAFE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {item.status === 'SAFE' ? '안전' : '위험'}
              </span>
            </div>
            <div className="p-4 flex gap-4 items-start">
              {/* 저장된 이미지 (Base64) 표시 */}
              <div className="w-20 h-20 flex-shrink-0 bg-black rounded-lg overflow-hidden border border-gray-600">
                {item.imageData ? (
                  <img src={item.imageData} alt="scan" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                )}
              </div>
              <div className="flex-1">
                 <h3 className="text-white font-bold mb-1 text-sm">{item.message}</h3>
                 {item.detail && <p className="text-xs text-gray-400">검출: {item.detail.join(', ')}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
 * 3. 결과 표시 및 카메라
 * ========================================================================= */
const ResultDisplay = ({ result, onRestart }) => {
  const { status, message, detail, imageData } = result;
  const colorMap = {
    SAFE: { bg: 'bg-green-600', text: 'text-gray-100', icon: '✅' },
    CAUTION: { bg: 'bg-yellow-600', text: 'text-gray-900', icon: '⚠️' },
    DANGER: { bg: 'bg-red-600', text: 'text-gray-100', icon: '❌' },
  };
  const { bg, text, icon } = colorMap[status] || colorMap.SAFE;

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-6 rounded-xl ${bg} shadow-2xl mx-auto w-full max-w-md mt-6`}>
      <div className="text-5xl drop-shadow-lg">{icon}</div>
      <h1 className={`text-2xl font-extrabold ${text} text-center`}>{status === 'SAFE' ? '안전 (Safe)' : '위험 (Danger)'}</h1>
      
      {/* 분석된 이미지 미리보기 */}
      {imageData && (
        <div className="w-40 h-40 rounded-lg overflow-hidden border-4 border-white/30 shadow-inner bg-black">
          <img src={imageData} alt="Analyzed" className="w-full h-full object-cover" />
        </div>
      )}

      <p className={`text-lg text-gray-100 text-center font-medium`}>{message}</p>
      
      {detail && (
         <div className="bg-black/30 p-4 rounded-lg w-full text-sm text-gray-200 border border-white/10">
            <strong>⚠️ 검출된 성분:</strong> {detail.join(', ')}
         </div>
      )}
      <button onClick={onRestart} className="mt-4 w-full py-3 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition">
        확인 및 저장 완료
      </button>
    </div>
  );
};

const CameraInput = ({ onScan }) => {
  const fileInputRef = useRef(null);
  
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onScan(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full bg-gray-900 text-white min-h-[60vh]">
      <div onClick={() => fileInputRef.current.click()} className="w-full max-w-xs cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed border-violet-700 rounded-3xl bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-2xl group">
        <div className="text-6xl mb-4 group-hover:scale-110 transition duration-300">📸</div>
        <span className="text-xl font-bold text-violet-300 group-hover:text-white">성분표 촬영하기</span>
        <p className="text-xs text-gray-500 mt-2">또는 갤러리에서 선택</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
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
      <p className="text-gray-400 text-sm">보유하고 계신 알레르기를 모두 선택해주세요.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALLERGEN_OPTIONS.map((item) => (
          <div key={item} onClick={() => handleToggle(item)} className={`p-3 rounded-lg cursor-pointer font-bold text-center transition duration-150 border ${selectedAllergies.includes(item) ? 'bg-red-600 text-white border-red-500 shadow-md transform scale-105' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
            {item}
          </div>
        ))}
      </div>
      <button onClick={onSave} className="w-full py-3 bg-violet-600 rounded-xl font-bold shadow-lg hover:bg-violet-700 transition">설정 저장하기</button>
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
  
  // 사용자별 데이터 State
  const [userAllergies, setUserAllergies] = useState([]);
  const [history, setHistory] = useState([]);

  // --- Auth Logic (사용자별 DB 분리) ---
  const handleAuth = (isLogin, data) => {
    const { email, password, name } = data;
    // 로컬 스토리지에서 유저 목록 불러오기
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');

    if (isLogin) {
      // 로그인 시도
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) { 
        loginUser(foundUser); 
        return true; 
      }
      return false;
    } else {
      // 회원가입 시도
      if (users.some(u => u.email === email)) return false; // 중복 이메일 체크
      
      const newUser = { id: Date.now().toString(), email, password, name };
      localStorage.setItem('app_users', JSON.stringify([...users, newUser]));
      loginUser(newUser); 
      return true;
    }
  };

  const loginUser = (user) => {
    setCurrentUser(user);
    // 해당 유저의 데이터만 불러오기 (보안 및 격리)
    setUserAllergies(JSON.parse(localStorage.getItem(`allergies_${user.id}`) || '[]'));
    setHistory(JSON.parse(localStorage.getItem(`history_${user.id}`) || '[]'));
    setCurrentPage(PAGES.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null); 
    setHistory([]); 
    setUserAllergies([]); 
    setCurrentPage(PAGES.AUTH);
  };

  // --- Data Persistence (자동 저장) ---
  useEffect(() => {
    if (currentUser) localStorage.setItem(`allergies_${currentUser.id}`, JSON.stringify(userAllergies));
  }, [userAllergies, currentUser]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(history));
  }, [history, currentUser]);

  // --- Scan Process (이미지 압축 + 판정 로직) ---
  const processScan = async (file) => {
    setScanState(PAGES.LOADING);
    
    // 1. 이미지 압축 (오프라인 저장용 Base64)
    const compressedImageBase64 = await compressImage(file);
    
    // 2. AI 분석 시뮬레이션 (1.5초)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. 판정 로직 (땅콩/새우/게/복숭아가 내 알러지 목록에 있으면 위험으로 판정)
    // 실제로는 OCR 텍스트와 비교하지만, 여기선 테스트를 위해 단순 로직 적용
    const dangerList = ['땅콩', '새우', '게', '복숭아'];
    const isDanger = userAllergies.some(a => dangerList.includes(a));
    
    const resultData = {
      status: isDanger ? 'DANGER' : 'SAFE',
      message: isDanger ? '🚨 위험 성분이 감지되었습니다!' : '✅ 안전한 식품입니다.',
      detail: isDanger ? ['해당 알레르기 유발 성분'] : null,
      imageData: compressedImageBase64 // 결과에 이미지 데이터 포함
    };

    setScanResult(resultData);
    setScanState(PAGES.RESULT);

    // 4. 기록 저장
    if (currentUser) {
      const newRecord = { id: Date.now(), timestamp: Date.now(), ...resultData };
      setHistory(prev => [newRecord, ...prev]);
    }
  };

  // --- Navigation & Rendering ---
  if (!currentUser) return <AuthView onAuth={handleAuth} />;

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.HOME:
        return (
          <div className="p-8 space-y-8 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 rounded-2xl shadow-lg transform transition hover:scale-[1.01]">
              <h1 className="text-2xl font-bold mb-2">반갑습니다, {currentUser.name}님! 👋</h1>
              <p className="text-violet-100 text-sm font-medium">
                {navigator.onLine ? '🟢 온라인 상태' : '⚡ 오프라인 모드 (사진 저장 가능)'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCurrentPage(PAGES.SCAN)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg group">
                <span className="text-4xl mb-2 group-hover:scale-110 transition">📸</span> 
                <span className="font-bold text-gray-200 group-hover:text-white">성분 스캔</span>
              </button>
              <button onClick={() => setCurrentPage(PAGES.HISTORY)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg group">
                <span className="text-4xl mb-2 group-hover:scale-110 transition">📂</span> 
                <span className="font-bold text-gray-200 group-hover:text-white">분석 앨범</span>
              </button>
            </div>

            <div className="mt-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-gray-400 font-bold">최근 분석 기록</h3>
                 <span className="text-xs text-violet-400 cursor-pointer" onClick={() => setCurrentPage(PAGES.HISTORY)}>전체보기</span>
               </div>
               {history.length > 0 ? (
                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center gap-3">
                   {history[0].imageData && <img src={history[0].imageData} className="w-10 h-10 rounded bg-black object-cover" />}
                   <div className="flex flex-col">
                     <span className={`text-xs font-bold ${history[0].status === 'SAFE' ? 'text-green-400' : 'text-red-400'}`}>
                       {history[0].status === 'SAFE' ? '안전' : '위험'}
                     </span>
                     <span className="text-xs text-gray-400">{new Date(history[0].timestamp).toLocaleDateString()}</span>
                   </div>
                 </div>
               ) : <p className="text-gray-600 text-sm p-4 bg-gray-800 rounded-lg text-center">기록이 없습니다.</p>}
            </div>
          </div>
        );
      case PAGES.SCAN:
        switch (scanState) {
          case PAGES.CAMERA: return <CameraInput onScan={processScan} />;
          case PAGES.LOADING: return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
               <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full"></div>
               <p className="text-white font-bold animate-pulse">이미지 분석 및 저장 중...</p>
             </div>
          );
          case PAGES.RESULT: return <ResultDisplay result={scanResult} onRestart={() => { setScanResult(null); setScanState(PAGES.CAMERA); }} />;
        }
        break;
      case PAGES.HISTORY: return <HistoryView history={history} />;
      case PAGES.ALLERGIES: return <AllergySelector selectedAllergies={userAllergies} onSelectionChange={setUserAllergies} onSave={() => setCurrentPage(PAGES.HOME)} />;
      case PAGES.INFO:
        return (
          <div className="p-8 text-white text-center space-y-6">
            <h1 className="text-2xl font-bold">내 정보</h1>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">{currentUser.name[0]}</div>
              <p className="text-xl font-bold">{currentUser.name}</p>
              <p className="text-gray-400 text-sm">{currentUser.email}</p>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => setCurrentPage(PAGES.ALLERGIES)} className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition">알레르기 설정 변경</button>
              <button onClick={handleLogout} className="w-full py-3 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 rounded-lg text-sm font-bold transition">로그아웃</button>
            </div>
          </div>
        );
      default: return <div>Error</div>;
    }
  };

  const navItems = [
    { page: PAGES.HOME, icon: '🏠', label: '홈' },
    { page: PAGES.SCAN, icon: '🔍', label: '스캔' },
    { page: PAGES.HISTORY, icon: '📂', label: '앨범' },
    { page: PAGES.ALLERGIES, icon: '⚙️', label: '설정' },
    { page: PAGES.INFO, icon: '👤', label: 'MY' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center font-sans-kr">
      <style>{`@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css'); .font-sans-kr { font-family: Pretendard, sans-serif; }`}</style>
      <div className="w-full max-w-lg bg-gray-900 shadow-2xl flex flex-col border-x border-gray-800 relative">
        <nav className="w-full bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50 py-4 px-6 flex justify-between items-center">
          <span className="text-violet-400 font-extrabold text-xl cursor-pointer" onClick={() => setCurrentPage(PAGES.HOME)}>AI-Foodie</span>
          <span className="text-xs text-gray-400">{currentUser.name}님</span>
        </nav>
        <main className="flex-grow">{renderContent()}</main>
        <footer className="bg-gray-900 border-t border-gray-800 sticky bottom-0 z-10 flex justify-around py-3">
          {navItems.map(item => (
            <button key={item.page} onClick={() => setCurrentPage(item.page)} className={`flex flex-col items-center text-xs font-bold transition ${currentPage === item.page ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400'}`}>
              <span className="text-xl mb-1">{item.icon}</span> {item.label}
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default App;