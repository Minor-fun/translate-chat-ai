/**
 *
 * Detects the language of a given piece of text.
 *
 * Attempts to detect the language of a sample of text using the Efficient Language Detector (ELD) library.
 *
 * @author Francois-Guillaume Ribreau - @FGRibreau
 * @author Ruslan Zavackiy - @Chaoser
 * @author Gemini AI (for integration of ELD)
 *
 * @see https://github.com/nitotm/efficient-language-detector-js
 *
 * @example
 * <code>
 * var LanguageDetect = require("./LanguageDetect");
 * var d = new LanguageDetect().detect('This is a test');
 * // d[0][0] == 'en'
 * // d[0][1] == score
 * // Good score are over 0.3
 * </code>
 */

var eld = require('./eld'); // Import the eld library

function getEldLanguages() {
  var info = eld.info && eld.info();
  if (!info) return [];

  if (info.Languages && typeof info.Languages === 'object') {
    return Object.keys(info.Languages)
      .sort(function (a, b) { return (+a) - (+b); })
      .map(function (k) { return info.Languages[k]; });
  }

  return [];
}

var TRADITIONAL_CHARS = [
  '丟並乾亂亙亞佇佈佔併來侖侶侷俁係俓俔俠俥俬倀倆倈倉個們倖倫倲偉偑側偵偽傌傑傖傘備傢傭傯傳傴債傷傾僂僅僉僑僕僞僤僥僨僱價儀儁儂億儈儉儎儐儔儕儘償儣優儭儲儷儸儺儻儼',
  '兇兌兒兗內兩冊冑冪凈凍凙凜凱別刪剄則剋剎剗剛剝剮剴創剷剾劃劇劉劊劌劍劏劑劚勁勑動務勛勝勞勢勣勩勱勳勵勸勻匭匯匱區協卹卻卽厙厠厤厭厲厴參叄叢吒吳吶呂咼員哯唄唓唸問',
  '啓啞啟啢喎喚喪喫喬單喲嗆嗇嗊嗎嗚嗩嗰嗶嗹嘆嘍嘓嘔嘖嘗嘜嘩嘪嘮嘯嘰嘳嘵嘸嘺嘽噁噅噓噚噝噞噠噥噦噯噲噴噸噹嚀嚇嚌嚐嚕嚙嚛嚥嚦嚧嚨嚮嚲嚳嚴嚶嚽囀囁囂囃囅囈囉囌囑囒囪圇',
  '國圍園圓圖團圞垻埡埨埬埰執堅堊堖堚堝堯場塊塋塏塒塗塚塢塤塵塸塹塿墊墜墠墮墰墲墳墶墻墾壇壈壋壎壓壗壘壙壚壜壞壟壠壢壣壩壪壯壺壼壽夠夢夥夾奐奧奩奪奬奮奼妝姍姦娙娛婁',
  '婡婦婭媈媧媯媰媼媽嫋嫗嫵嫺嫻嫿嬀嬃嬇嬈嬋嬌嬙嬡嬣嬤嬦嬪嬰嬸嬻孃孄孆孇孋孌孎孫學孻孾孿宮寀寠寢實寧審寫寬寵寶將專尋對導尷屆屍屓屜屢層屨屩屬岡峯峴島峽崍崑崗崙崢崬嵐',
  '嵗嵼嵽嵾嶁嶄嶇嶈嶔嶗嶘嶠嶢嶧嶨嶮嶸嶹嶺嶼嶽巊巋巒巔巖巗巘巰巹帥師帳帶幀幃幓幗幘幝幟幣幩幫幬幹幾庫廁廂廄廈廎廕廚廝廞廟廠廡廢廣廧廩廬廳弒弔弳張強彃彄彆彈彌彎彔彙彠',
  '彥彫彲彷彿後徑從徠復徵徹徿恆恥悅悞悵悶悽惡惱惲惻愛愜愨愴愷愻愾慄態慍慘慚慟慣慤慪慫慮慳慶慺慼慾憂憊憐憑憒憖憚憢憤憫憮憲憶憸憹懀懇應懌懍懎懞懟懣懤懨懲懶懷懸懺懼懾',
  '戀戇戔戧戩戰戱戲戶拋挩挱挾捨捫捱捲掃掄掆掗掙掚掛採揀揚換揮揯損搖搗搵搶摋摐摑摜摟摯摳摶摺摻撈撊撏撐撓撝撟撣撥撧撫撲撳撻撾撿擁擄擇擊擋擓擔據擟擠擣擫擬擯擰擱擲擴擷',
  '擺擻擼擽擾攄攆攋攏攔攖攙攛攜攝攢攣攤攪攬敎敓敗敘敵數斂斃斅斆斕斬斷斸於旂旣昇時晉晛晝暈暉暐暘暢暫曄曆曇曉曊曏曖曠曥曨曬書會朥朧朮東枴柵柺査桱桿梔梖梘梜條梟梲棄棊',
  '棖棗棟棡棧棲棶椏椲楇楊楓楨業極榘榦榪榮榲榿構槍槓槤槧槨槫槮槳槶槼樁樂樅樑樓標樞樠樢樣樤樧樫樳樸樹樺樿橈橋機橢橫橯檁檉檔檜檟檢檣檭檮檯檳檵檸檻櫃櫅櫍櫓櫚櫛櫝櫞櫟櫠',
  '櫥櫧櫨櫪櫫櫬櫱櫳櫸櫻欄欅欇權欍欏欐欑欒欓欖欘欞欽歎歐歟歡歲歷歸歿殘殞殢殤殨殫殭殮殯殰殲殺殻殼毀毆毊毿氂氈氌氣氫氬氭氳氾汎汙決沒沖況泝洩洶浹浿涇涗涼淒淚淥淨淩淪淵',
  '淶淺渙減渢渦測渾湊湋湞湧湯溈準溝溡溫溮溳溼滄滅滌滎滙滬滯滲滷滸滻滾滿漁漊漍漚漢漣漬漲漵漸漿潁潑潔潕潙潚潛潤潯潰潷潿澀澅澆澇澐澗澠澤澦澩澫澬澮澱澾濁濃濄濆濕濘濚濛',
  '濜濟濤濧濫濰濱濺濼濾濿瀂瀃瀅瀆瀇瀉瀋瀏瀕瀘瀝瀟瀠瀦瀧瀨瀰瀲瀾灃灄灍灑灒灕灘灙灝灡灣灤灧灩災為烏烴無煇煉煒煙煢煥煩煬煱熂熅熉熌熒熓熗熚熡熰熱熲熾燀燁燈燉燒燖燙燜營',
  '燦燬燭燴燶燻燼燾爃爄爇爍爐爖爛爥爧爭爲爺爾牀牆牘牴牽犖犛犞犢犧狀狹狽猌猙猶猻獁獃獄獅獊獎獨獩獪獫獮獰獱獲獵獷獸獺獻獼玁珼現琱琺琿瑋瑒瑣瑤瑩瑪瑲瑻瑽璉璊璕璗璝璡璣',
  '璦璫璯環璵璸璼璽璾璿瓄瓅瓊瓏瓔瓕瓚瓛甌甕產産甦甯畝畢畫異畵當畼疇疊痙痠痮痾瘂瘋瘍瘓瘞瘡瘧瘮瘱瘲瘺瘻療癆癇癉癐癒癘癟癡癢癤癥癧癩癬癭癮癰癱癲發皁皚皟皰皸皺盃盜盞盡',
  '監盤盧盨盪眝眞眥眾睍睏睜睞瞘瞜瞞瞤瞭瞶瞼矇矉矑矓矚矯硃硜硤硨硯碕碙碩碭碸確碼碽磑磚磠磣磧磯磽磾礄礆礎礐礒礙礦礪礫礬礮礱祇祕祿禍禎禡禦禪禮禰禱禿秈稅稈稏稜稟種稱穀',
  '穇穌積穎穠穡穢穩穫穭窩窪窮窯窵窶窺竄竅竇竈竊竚竪竱競筆筍筧筴箇箋箏節範築篋篔篘篠篢篤篩篳篸簀簂簍簑簞簡簢簣簫簹簽簾籃籅籋籌籔籙籛籜籟籠籤籩籪籬籮籲粵糉糝糞糧糰糲',
  '糴糶糹糺糾紀紂紃約紅紆紇紈紉紋納紐紓純紕紖紗紘紙級紛紜紝紞紟紡紬紮細紱紲紳紵紹紺紼紿絀絁終絃組絅絆絍絎結絕絙絛絝絞絡絢絥給絧絨絪絰統絲絳絶絹絺綀綁綃綄綆綇綈綉綋',
  '綌綎綏綐綑經綖綜綝綞綟綠綡綢綣綧綪綫綬維綯綰綱網綳綴綵綸綹綺綻綽綾綿緄緇緊緋緍緑緒緓緔緗緘緙線緝緞緟締緡緣緤緦編緩緬緮緯緰緱緲練緶緷緸緹緻緼縈縉縊縋縍縎縐縑縕縗',
  '縛縝縞縟縣縧縫縬縭縮縯縰縱縲縳縴縵縶縷縸縹縺總績繂繃繅繆繈繏繐繒繓織繕繚繞繟繡繢繨繩繪繫繬繭繮繯繰繳繶繷繸繹繻繼繽繾繿纁纆纇纈纊續纍纏纓纔纕纖纗纘纚纜缽罃罈罌罰',
  '罵罷羅羆羈羋羣羥羨義羵羶習翫翬翹翽耬耮聖聞聯聰聲聳聵聶職聹聻聽聾肅脅脈脛脣脥脩脫脹腎腖腡腦腪腫腳腸膃膕膚膞膠膢膩膹膽膾膿臉臍臏臗臘臚臟臠臢臥臨臺與興舉舊舘艙艣艤',
  '艦艫艱艷芻苧茲荊莊莖莢莧菕華菴菸萇萊萬萴萵葉葒葝葤葦葯葷蒍蒐蒓蒔蒕蒞蒭蒼蓀蓆蓋蓧蓮蓯蓴蓽蔄蔔蔘蔞蔣蔥蔦蔭蔯蔿蕁蕆蕎蕒蕓蕕蕘蕝蕢蕩蕪蕭蕳蕷蕽薀薆薈薊薌薑薔薘薟薦薩',
  '薳薴薵薹薺藉藍藎藝藥藪藭藴藶藷藹藺蘀蘄蘆蘇蘊蘋蘚蘞蘟蘢蘭蘺蘿虆虉處虛虜號虧虯蛺蛻蜆蝀蝕蝟蝦蝨蝸螄螞螢螮螻螿蟂蟄蟈蟎蟘蟜蟣蟬蟯蟲蟳蟶蟻蠀蠁蠅蠆蠍蠐蠑蠔蠙蠟蠣蠦蠨蠱',
  '蠶蠻蠾衆衊術衕衚衛衝衹袞裊裏補裝裡製複褌褘褲褳褸褻襀襇襉襏襓襖襗襘襝襠襤襪襬襯襰襲襴襵覆覈見覎規覓視覘覛覡覥覦親覬覯覲覷覹覺覼覽覿觀觴觶觸訁訂訃計訊訌討訏訐訑訒',
  '訓訕訖託記訛訜訝訞訟訢訣訥訨訩訪設許訴訶診註証詀詁詆詊詎詐詑詒詓詔評詖詗詘詛詝詞詠詡詢詣試詩詪詫詬詭詮話該詳詵詷詼詿誂誄誅誆誇誋誌認誑誒誕誘誚語誠誡誣誤誥誦誨說',
  '誫説誰課誳誴誶誷誹誺誼誾調諂諄談諉請諍諏諑諒諓論諗諛諜諝諞諟諡諢諣諤諥諦諧諫諭諮諯諰諱諲諳諴諶諷諸諺諼諾謀謁謂謄謅謆謉謊謎謏謐謔謖謗謙謚講謝謠謡謨謫謬謭謯謱謳謸',
  '謹謾譁譂譅譆證譊譎譏譑譓譖識譙譚譜譞譟譨譫譭譯議譴護譸譽譾讀讅變讋讌讎讒讓讕讖讚讜讞豈豎豐豔豬豵豶貓貗貙貝貞貟負財貢貧貨販貪貫責貯貰貲貳貴貶買貸貺費貼貽貿賀賁賂',
  '賃賄賅資賈賊賑賒賓賕賙賚賜賝賞賟賠賡賢賣賤賦賧質賫賬賭賰賴賵賺賻購賽賾贃贄贅贇贈贉贊贋贍贏贐贑贓贔贖贗贚贛贜赬趕趙趨趲跡踐踰踴蹌蹔蹕蹟蹠蹣蹤蹳蹺蹻躂躉躊躋躍躎躑',
  '躒躓躕躘躚躝躡躥躦躪軀軉車軋軌軍軏軑軒軔軕軗軛軜軝軟軤軨軫軬軲軷軸軹軺軻軼軾軿較輄輅輇輈載輊輋輒輓輔輕輖輗輛輜輝輞輟輢輥輦輨輩輪輬輮輯輳輶輷輸輻輼輾輿轀轂轄轅轆',
  '轇轉轊轍轎轐轔轗轟轠轡轢轣轤辦辭辮辯農迴逕這連週進遊運過達違遙遜遞遠遡適遱遲遷選遺遼邁還邇邊邏邐郟郵鄆鄉鄒鄔鄖鄟鄧鄩鄭鄰鄲鄳鄴鄶鄺酇酈醃醖醜醞醟醣醫醬醱醲醶釀釁',
  '釃釅釋釐釒釓釔釕釗釘釙釚針釟釣釤釦釧釨釩釲釳釴釵釷釹釺釾釿鈀鈁鈃鈄鈅鈆鈇鈈鈉鈋鈍鈎鈐鈑鈒鈔鈕鈖鈗鈛鈞鈠鈡鈣鈥鈦鈧鈮鈯鈰鈲鈳鈴鈷鈸鈹鈺鈽鈾鈿鉀鉁鉅鉆鉈鉉鉊鉋鉍鉑鉔',
  '鉕鉗鉚鉛鉝鉞鉠鉢鉤鉥鉦鉧鉬鉭鉮鉳鉶鉷鉸鉺鉻鉽鉾鉿銀銁銂銃銅銈銊銍銏銑銓銖銘銚銛銜銠銣銥銦銨銩銪銫銬銱銳銶銷銹銻銼鋁鋂鋃鋅鋇鋉鋌鋏鋐鋒鋗鋙鋝鋟鋠鋣鋤鋥鋦鋨鋩鋪鋭鋮',
  '鋯鋰鋱鋶鋸鋹鋼錀錁錂錄錆錇錈錏錐錒錕錘錙錚錛錜錝錞錟錠錡錢錤錥錦錨錩錫錮錯録錳錶錸錼錽鍀鍁鍃鍄鍅鍆鍇鍈鍉鍊鍋鍍鍒鍔鍘鍚鍛鍠鍤鍥鍩鍬鍭鍮鍰鍵鍶鍺鍼鍾鎂鎄鎇鎈鎊鎌鎍',
  '鎓鎔鎖鎘鎙鎚鎛鎝鎞鎡鎢鎣鎦鎧鎩鎪鎬鎭鎮鎯鎰鎲鎳鎵鎶鎷鎸鎿鏃鏆鏇鏈鏉鏌鏍鏏鏐鏑鏗鏘鏚鏜鏝鏞鏟鏡鏢鏤鏥鏦鏨鏰鏵鏷鏹鏺鏻鏽鏾鐃鐄鐇鐈鐋鐍鐎鐏鐐鐒鐓鐔鐘鐙鐝鐠鐥鐦鐧鐨鐩',
  '鐪鐫鐮鐯鐲鐳鐵鐶鐸鐺鐼鐽鐿鑀鑄鑉鑊鑌鑑鑒鑔鑕鑞鑠鑣鑥鑪鑭鑰鑱鑲鑴鑷鑹鑼鑽鑾鑿钁钂長門閂閃閆閈閉開閌閍閎閏閐閑閒間閔閗閘閝閞閡閣閤閥閨閩閫閬閭閱閲閵閶閹閻閼閽閾閿',
  '闃闆闇闈闉闊闋闌闍闐闑闒闓闔闕闖關闞闠闡闢闤闥阪陘陝陞陣陰陳陸陽隉隊階隑隕際隤隨險隮隯隱隴隸隻雋雖雙雛雜雞離難雲電霑霢霣霧霼霽靂靄靆靈靉靚靜靝靦靧靨鞏鞝鞦鞽鞾韁',
  '韃韆韉韋韌韍韓韙韚韛韜韝韞韠韻響頁頂頃項順頇須頊頌頍頎頏預頑頒頓頔頗領頜頠頡頤頦頫頭頮頰頲頴頵頷頸頹頻頽顂顃顅顆題額顎顏顒顓顔顗願顙顛類顢顣顥顧顫顬顯顰顱顳顴風',
  '颭颮颯颰颱颳颶颷颸颺颻颼颾飀飄飆飈飋飛飠飢飣飥飦飩飪飫飭飯飱飲飴飵飶飼飽飾飿餃餄餅餈餉養餌餎餏餑餒餓餔餕餖餗餘餚餛餜餞餡餦餧館餪餫餬餭餱餳餵餶餷餸餺餼餾餿饁饃饅',
  '饈饉饊饋饌饑饒饗饘饜饞饟饠饢馬馭馮馯馱馳馴馹馼駁駃駉駊駎駐駑駒駓駔駕駘駙駚駛駝駞駟駡駢駤駧駩駪駫駭駰駱駶駸駻駼駿騁騂騃騄騅騉騊騌騍騎騏騑騔騖騙騚騜騝騞騟騠騤騧騪',
  '騫騭騮騰騱騴騵騶騷騸騻騼騾驀驁驂驃驄驅驊驋驌驍驎驏驓驕驗驙驚驛驟驢驤驥驦驨驪驫骯髏髒體髕髖髮鬆鬍鬖鬚鬠鬢鬥鬧鬨鬩鬮鬱鬹魎魘魚魛魟魢魥魦魨魯魴魵魷魺魽鮀鮁鮃鮄鮅鮆',
  '鮈鮊鮋鮍鮎鮐鮑鮒鮓鮚鮜鮝鮞鮟鮠鮡鮣鮤鮦鮪鮫鮭鮮鮯鮰鮳鮵鮶鮸鮺鮿鯀鯁鯄鯆鯇鯉鯊鯒鯔鯕鯖鯗鯛鯝鯞鯡鯢鯤鯧鯨鯪鯫鯬鯰鯱鯴鯶鯷鯻鯽鯾鯿鰁鰂鰃鰆鰈鰉鰊鰋鰌鰍鰏鰐鰑鰒鰓鰕鰛',
  '鰜鰟鰠鰣鰤鰥鰦鰧鰨鰩鰫鰭鰮鰱鰲鰳鰵鰶鰷鰹鰺鰼鰽鰾鱀鱂鱄鱅鱆鱇鱈鱉鱊鱒鱔鱖鱗鱘鱚鱝鱟鱠鱢鱣鱤鱧鱨鱭鱮鱯鱲鱷鱸鱺鳥鳧鳩鳬鳲鳳鳴鳶鳷鳼鳽鳾鴀鴃鴅鴆鴇鴉鴐鴒鴔鴕鴗鴛鴜鴝',
  '鴞鴟鴣鴥鴦鴨鴮鴯鴰鴲鴳鴴鴷鴻鴽鴿鵁鵂鵃鵊鵏鵐鵑鵒鵓鵚鵜鵝鵟鵠鵡鵧鵩鵪鵫鵬鵮鵯鵰鵲鵷鵾鶄鶇鶉鶊鶌鶒鶓鶖鶗鶘鶚鶠鶡鶥鶦鶩鶪鶬鶭鶯鶰鶱鶲鶴鶹鶺鶻鶼鶿鷀鷁鷂鷄鷅鷉鷊鷐鷓',
  '鷔鷖鷗鷙鷚鷟鷣鷤鷥鷦鷨鷩鷫鷭鷯鷲鷳鷴鷷鷸鷹鷺鷽鷿鸂鸇鸊鸋鸌鸏鸑鸕鸗鸘鸚鸛鸝鸞鹵鹹鹺鹼鹽麗麥麨麩麪麫麬麯麲麳麴麵麷麼麽黃黌點黨黲黴黶黷黽黿鼂鼉鼕鼴齊齋齎齏齒齔齕齗',
  '齘齙齜齟齠齡齣齦齧齩齪齬齭齮齯齰齲齴齶齷齼齾龍龎龐龑龓龔龕龜龭龯鿁鿓'
].join('');

var TRADITIONAL_CHAR_REGEX = new RegExp('[' + TRADITIONAL_CHARS + ']');

var LanguageDetect = module.exports = function () {};

LanguageDetect.prototype = {

  /**
   * Returns the number of languages that this object can detect
   *
   * @access public
   * @return int the number of languages
   */
  getLanguageCount: function () {
    return getEldLanguages().length;
  },

  /**
   * Returns the list of detectable languages
   *
   * @access public
   * @return object the names of the languages known to this object
   */
  getLanguages: function () {
    return getEldLanguages();
  },

  /**
   * Detects the closeness of a sample of text to the known languages
   *
   * @access  public
   * @param   sample  a sample of text to compare.
   * @param   limit  if specified, return an array of the most likely
   *                  $limit languages and their scores.
   * @return  Array   sorted array of language scores, blank array if no
   *                  useable text was found
   */
  detect: function (sample, limit) {
    limit = +limit || 0;

    // Force convert to string
    sample = String(sample);

    if (sample === '' || sample.length < 3) return [];

    var detected = eld.detect(sample);
    var scores = [];


    if (detected && detected.language !== 'und') {
      var eldScores = detected.getScores();
      for (var langCode in eldScores) {
        if (eldScores.hasOwnProperty(langCode)) {

          scores.push([langCode, eldScores[langCode]]);
        }
      }
    }

    scores.sort(function (a, b) { return b[1] - a[1]; });

    if (scores.length > 0 && scores[0][0] === 'zh') {

      if (this._hasTraditionalChineseChar(sample)) {
        scores[0][0] = 'zh-TW';
      }
    }


    return limit > 0 ? scores.slice(0, limit) : scores;
  },


  /**
   * Check if text contains any Traditional Chinese specific characters
   * @param {string} text
   * @returns {boolean}
   */
  _hasTraditionalChineseChar: function (text) {
    return TRADITIONAL_CHAR_REGEX.test(text);
  }
};

