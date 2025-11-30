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
 * 유틸리티 함수: 이미지 압축 및 Base64 변환 (오프라인 저장용)
 * ========================================================================= */
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 캔버스를 생성하여 이미지 리사이징 (너비 300px 기준)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 용량을 줄이기 위해 JPEG 포맷, 품질 0.7로 변환
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

    const success = onAuth(activeTab, { email, password, name });
    if (!success) setError(activeTab === 'login' ? '정보가 일치하지 않습니다.' : '이미 가입된 이메일입니다.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-sans-kr mb-2">AI-Foodie</h1>
        <p className="text-gray-400 font-sans-kr text-sm">오프라인에서도 안전하게</p>
      </div>

      <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button onClick={() => handleTabChange('login')} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'login' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-500'}`}>로그인</button>
          <button onClick={() => handleTabChange('signup')} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'signup' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-500'}`}>회원가입</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {activeTab === 'signup' && (
            <input type="text" placeholder="이름" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          )}
          <input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          <input type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-violet-500"/>
          
          {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-lg bg-violet-600 text-white font-bold hover:bg-violet-700 transition mt-2">
            {activeTab === 'login' ? '시작하기' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
 * 2. 기록 보관함 (이미지 표시 기능 추가됨)
 * ========================================================================= */
const HistoryView = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="text-4xl mb-4">📂</div>
        <p>기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 space-y-6 bg-gray-900 min-h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold text-white font-sans-kr">📸 나의 분석 앨범</h2>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 border-b border-gray-700">
              <span className="text-gray-300 text-xs">
                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'SAFE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {item.status === 'SAFE' ? '안전' : '위험'}
              </span>
            </div>
            <div className="p-4 flex gap-4 items-start">
              {/* 여기에 저장된 이미지를 표시합니다 */}
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
 * 3. 결과 및 카메라 화면
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
      <div className="text-5xl">{icon}</div>
      <h1 className={`text-2xl font-extrabold ${text} text-center`}>{status === 'SAFE' ? '안전' : '위험'}</h1>
      
      {/* 분석한 이미지 보여주기 */}
      {imageData && (
        <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-white/20 shadow-inner">
          <img src={imageData} alt="Analyzed" className="w-full h-full object-cover" />
        </div>
      )}

      <p className={`text-lg text-gray-100 text-center`}>{message}</p>
      
      {detail && (
         <div className="bg-black/20 p-4 rounded-lg w-full text-sm text-gray-200">
            <strong>검출:</strong> {detail.join(', ')}
         </div>
      )}
      <button onClick={onRestart} className="mt-4 w-full py-3 bg-white text-gray-900 font-bold rounded-xl shadow-lg">확인</button>
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
      <div onClick={() => fileInputRef.current.click()} className="w-full max-w-xs cursor-pointer flex flex-col items-center justify-center p-10 border-4 border-dashed border-violet-700 rounded-2xl bg-gray-800 hover:bg-gray-700 transition">
        <div className="text-5xl mb-4">📸</div>
        <span className="text-xl font-bold">성분표 촬영</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALLERGEN_OPTIONS.map((item) => (
          <div key={item} onClick={() => handleToggle(item)} className={`p-3 rounded-lg cursor-pointer font-bold text-center transition ${selectedAllergies.includes(item) ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
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
  const [userAllergies, setUserAllergies] = useState([]);
  const [history, setHistory] = useState([]);

  // --- Auth & Data Logic ---
  const handleAuth = (isLogin, data) => {
    const { email, password, name } = data;
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    if (isLogin) {
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) { loginUser(foundUser); return true; }
      return false;
    } else {
      if (users.some(u => u.email === email)) return false;
      const newUser = { id: Date.now().toString(), email, password, name };
      localStorage.setItem('app_users', JSON.stringify([...users, newUser]));
      loginUser(newUser); return true;
    }
  };

  const loginUser = (user) => {
    setCurrentUser(user);
    // Load Data
    setUserAllergies(JSON.parse(localStorage.getItem(`allergies_${user.id}`) || '[]'));
    setHistory(JSON.parse(localStorage.getItem(`history_${user.id}`) || '[]'));
    setCurrentPage(PAGES.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null); setHistory([]); setUserAllergies([]); setCurrentPage(PAGES.AUTH);
  };

  useEffect(() => {
    if (currentUser) localStorage.setItem(`allergies_${currentUser.id}`, JSON.stringify(userAllergies));
  }, [userAllergies, currentUser]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(history));
  }, [history, currentUser]);

  // --- Scan Process (With Image Compression) ---
  const processScan = async (file) => {
    setScanState(PAGES.LOADING);
    
    // 1. 이미지를 압축해서 Base64 문자열로 변환 (오프라인 저장용)
    const compressedImageBase64 = await compressImage(file);
    
    // 2. AI 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isDanger = userAllergies.some(a => ['땅콩', '새우', '게'].includes(a));
    const resultData = {
      status: isDanger ? 'DANGER' : 'SAFE',
      message: isDanger ? '🚨 위험 성분이 감지되었습니다!' : '✅ 안전한 식품입니다.',
      detail: isDanger ? ['알레르기 성분'] : null,
      imageData: compressedImageBase64 // 압축된 이미지 데이터를 결과에 포함
    };

    setScanResult(resultData);
    setScanState(PAGES.RESULT);

    if (currentUser) {
      const newRecord = { id: Date.now(), timestamp: Date.now(), ...resultData };
      setHistory(prev => [newRecord, ...prev]);
    }
  };

  // --- Render ---
  if (!currentUser) return <AuthView onAuth={handleAuth} />;

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.HOME:
        return (
          <div className="p-8 space-y-8 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 rounded-2xl shadow-lg">
              <h1 className="text-2xl font-bold mb-2">반갑습니다, {currentUser.name}님!</h1>
              <p className="text-violet-100 text-sm">오프라인 모드: {navigator.onLine ? '온라인 ✅' : '오프라인 ⚡'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCurrentPage(PAGES.SCAN)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg">
                <span className="text-4xl mb-2">📸</span> <span className="font-bold">스캔</span>
              </button>
              <button onClick={() => setCurrentPage(PAGES.HISTORY)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-violet-500 transition flex flex-col items-center shadow-lg">
                <span className="text-4xl mb-2">📂</span> <span className="font-bold">앨범</span>
              </button>
            </div>
            <div className="mt-4">
               <h3 className="text-gray-400 font-bold mb-2">최근 기록</h3>
               {history.length > 0 ? (
                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center gap-3">
                   {history[0].imageData && <img src={history[0].imageData} className="w-10 h-10 rounded bg-black object-cover" />}
                   <span className="text-sm">{history[0].message}</span>
                 </div>
               ) : <p className="text-gray-600 text-sm">기록이 없습니다.</p>}
            </div>
          </div>
        );
      case PAGES.SCAN:
        switch (scanState) {
          case PAGES.CAMERA: return <CameraInput onScan={processScan} />;
          case PAGES.LOADING: return <div className="text-white text-center mt-20 text-xl font-bold animate-pulse">이미지 분석 및 저장 중... 💾</div>;
          case PAGES.RESULT: return <ResultDisplay result={scanResult} onRestart={() => { setScanResult(null); setScanState(PAGES.CAMERA); }} />;
        }
        break;
      case PAGES.HISTORY: return <HistoryView history={history} />;
      case PAGES.ALLERGIES: return <AllergySelector selectedAllergies={userAllergies} onSelectionChange={setUserAllergies} onSave={() => setCurrentPage(PAGES.HOME)} />;
      case PAGES.INFO:
        return (
          <div className="p-8 text-white text-center space-y-6">
            <h1 className="text-2xl font-bold">내 정보</h1>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="w-20 h-20 bg-violet-500 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4">{currentUser.name[0]}</div>
              <p className="text-xl font-bold">{currentUser.name}</p>
              <p className="text-gray-400 text-sm">{currentUser.email}</p>
            </div>
            <button onClick={handleLogout} className="w-full py-3 bg-red-900/30 text-red-400 border border-red-900 rounded-lg text-sm font-bold">로그아웃</button>
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
            <button key={item.page} onClick={() => setCurrentPage(item.page)} className={`flex flex-col items-center text-xs font-bold transition ${currentPage === item.page ? 'text-violet-400' : 'text-gray-600'}`}>
              <span className="text-xl mb-1">{item.icon}</span> {item.label}
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default App;