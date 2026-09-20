const RP_SEED_DATA = {
  "اطفال": {
    "patientInfo": "طفل عمره 4 سنوات حضر بسبب حرارة منذ يومين مع قلة نشاط وشهية، ويحتاج لتقييم سبب الحمى وتحديد إذا كان هناك مصدر واضح أو علامات خطورة.",
    "differentials": [
      {
        "title": "عدوى فيروسية <span class='eng'>Viral infection</span>",
        "desc": "الأكثر شيوعاً عند الأطفال، وغالباً معها أعراض مثل الرشح أو السعال أو الإسهال، والطفل يكون بحالة عامة جيدة نسبياً."
      },
      {
        "title": "عدوى بكتيرية <span class='eng'>Bacterial infection</span>",
        "desc": "نفكر فيها أكثر إذا كان الطفل يبدو مريضاً بشكل واضح أو توجد علامات مصدر محدد مثل التهاب رئوي، التهاب بول، أو التهاب سحايا."
      },
      {
        "title": "التهاب المسالك البولية <span class='eng'>Urinary tract infection (UTI)</span>",
        "desc": "مهم خصوصاً عند الرضع والأطفال الذين لديهم حرارة بدون مصدر واضح؛ قد لا تظهر أعراض بولية واضحة عند الصغار."
      },
      {
        "title": "التهاب رئوي <span class='eng'>Pneumonia</span>",
        "desc": "نبحث عنه عند وجود سعال، تسرع تنفس، صعوبة تنفس أو نقص أكسجة، مع التركيز على معدل التنفس وشكل التنفس."
      }
    ],
    "history": [
      {
        "title": "متى بدأت الحرارة وكم أعلى درجة؟",
        "desc": "نعرف مدة الحمى وشدتها ونربطها بتطور الأعراض، ونسأل كيف تم قياس الحرارة."
      },
      {
        "title": "هل يوجد سعال أو رشح أو صعوبة بالتنفس؟",
        "desc": "يساعدنا في تحديد مصدر تنفسي، وصعوبة التنفس تحديداً مهمة لاكتشاف مرض شديد مثل الالتهاب الرئوي."
      },
      {
        "title": "هل يوجد قيء أو إسهال أو ألم بالبطن؟",
        "desc": "نبحث عن مصدر هضمي ونقيّم خطر الجفاف."
      },
      {
        "title": "هل يوجد حرقة أو ألم عند التبول أو تغير برائحة البول؟",
        "desc": "للبحث عن <span class='eng'>UTI</span>، خصوصاً إذا كانت الحرارة بدون مصدر واضح."
      },
      {
        "title": "هل الطفل يشرب ويتبول بشكل طبيعي؟",
        "desc": "هذا من أهم الأسئلة لتقييم الترطيب؛ قلة الشرب وقلة البول قد تشير إلى <span class='eng'>dehydration</span>."
      },
      {
        "title": "هل الطفل مطعّم حسب الجدول؟",
        "desc": "حالة التطعيم تغيّر احتمالية بعض العدوى الخطيرة مثل <span class='eng'>meningitis</span> وبعض العدوى البكتيرية."
      },
      {
        "title": "هل أخذ أدوية أو مضاداً حيوياً قبل الحضور؟",
        "desc": "نعرف تأثير العلاج السابق، الجرعات، وهل يمكن أن يكون قد أخفى بعض العلامات أو أدى لاستخدام غير مناسب للمضادات."
      }
    ],
    "examText": "بالراوند ابدأ بـ <span class='eng'>general appearance</span>: هل الطفل alert ومتفاعل أم lethargic؟ ثم افحص العلامات الحيوية كاملة: الحرارة، النبض، معدل التنفس، ضغط الدم، وSpO2. قيّم التنفس: وجود <span class='eng'>retractions</span> أو nasal flaring أو grunting. افحص الترطيب: الأغشية المخاطية، الدموع، امتلاء الشعيرات <span class='eng'>capillary refill</span>، والنبض والبول. بعد ذلك ابحث عن مصدر للحمى: افحص الحلق والأذنين، الصدر بالسماعة، البطن، الجلد والطفح، وافحص الرقبة وعلامات تهيج السحايا إذا كان العمر والحالة السريرية يسمحان.",
    "redFlags": [
      {
        "title": "تغير مستوى الوعي أو خمول شديد",
        "desc": "إذا كان الطفل غير مستجيب، صعب الإيقاظ أو يبدو شديد المرض، يجب تصعيد الحالة فوراً وتقييم <span class='eng'>sepsis</span> أو مرض خطير."
      },
      {
        "title": "صعوبة واضحة في التنفس أو نقص الأكسجة",
        "desc": "وجود severe retractions أو grunting أو cyanosis أو انخفاض <span class='eng'>SpO2</span> يستدعي تقييماً عاجلاً."
      },
      {
        "title": "علامات الجفاف الشديد",
        "desc": "قلة أو انعدام البول، جفاف شديد، prolonged capillary refill، برودة الأطراف أو ضعف النبض تستدعي تدخلاً سريعاً."
      },
      {
        "title": "طفح نزفي أو غير مبيض بالضغط",
        "desc": "طفح <span class='eng'>petechial/purpuric</span> مع حرارة قد يشير إلى عدوى شديدة مثل meningococcal disease ويحتاج تقييماً فورياً."
      }
    ],
    "drugs": [
      {
        "title": "باراسيتامول <span class='eng'>Paracetamol</span>",
        "desc": "يُستخدم لتخفيف الألم والانزعاج وخفض الحرارة عند الحاجة، وتُحسب جرعته حسب وزن الطفل."
      },
      {
        "title": "إيبوبروفين <span class='eng'>Ibuprofen</span>",
        "desc": "خافض حرارة ومسكن مناسب لبعض الأطفال حسب العمر والوزن، ويُتجنب عند وجود جفاف مهم أو بعض حالات القصور الكلوي."
      },
      {
        "title": "المضادات الحيوية <span class='eng'>Antibiotics</span>",
        "desc": "لا تُعطى لمجرد وجود حرارة؛ تُستخدم عندما يكون هناك اشتباه أو تشخيص لعدوى بكتيرية يتطلب علاجاً، ويُختار النوع حسب مصدر العدوى والحالة السريرية."
      }
    ],
    "pimping": {
      "question": "ما أهم شيء تقيّمه أولاً عند طفل عنده fever بالراوند؟",
      "answer": "الحالة العامة للطفل ووجود علامات الخطر، وليس رقم الحرارة وحده؛ أقيّم ABC، العلامات الحيوية، مستوى الوعي، التنفس، والدوران ثم أبحث عن مصدر الحمى."
    }
  },
  "الأشعة": {
    "patientInfo": "مريض حضر بقسم الأشعة <span class='eng'>Radiology</span> لتقييم ألم حاد في البطن أو الصدر، والمطلوب اختيار الفحص التصويري المناسب، قراءة الصورة بشكل منظم، وربط النتيجة بالحالة السريرية.",
    "differentials": [
      {
        "title": "التهاب الزائدة الدودية <span class='eng'>Acute Appendicitis</span>",
        "desc": "نفكر فيه مع ألم يبدأ حول السرة ثم ينتقل للجهة اليمنى السفلية مع غثيان أو حرارة. الـ CT أو ultrasound قد يساعدان حسب العمر والحالة."
      },
      {
        "title": "حصوة الكلية <span class='eng'>Urolithiasis</span>",
        "desc": "ألم شديد مغصي من الخاصرة وقد يمتد للمغبن مع hematuria. الـ non-contrast CT هو فحص حساس للحصوات في كثير من الحالات."
      },
      {
        "title": "ذات الرئة <span class='eng'>Pneumonia</span>",
        "desc": "السعال والحمى وضيق النفس مع opacity أو consolidation على chest X-ray تدعم التشخيص، لكن الصورة وحدها لا تكفي بدون السياق السريري."
      },
      {
        "title": "استرواح الصدر <span class='eng'>Pneumothorax</span>",
        "desc": "يظهر كهواء في الحيز الجنبي مع غياب vascular markings خارج خط الـ pleural edge. إذا كان tension pneumothorax مع عدم استقرار، العلاج لا ينتظر التصوير."
      }
    ],
    "history": [
      {
        "title": "شو الأعراض ومتى بدأت؟",
        "desc": "الـ onset والمدة مهمان جداً؛ الألم المفاجئ يختلف عن الألم التدريجي ويساعدان في تحديد الفحص المناسب."
      },
      {
        "title": "وين مكان الألم وهل بيمتد لمكان ثاني؟",
        "desc": "Pain location وradiation يعطونا clue عن العضو المصاب، مثل ألم الخاصرة الممتد للمغبن في renal colic."
      },
      {
        "title": "هل في حرارة، سعال، قيء، نزيف أو تغير بالبول أو البراز؟",
        "desc": "هذه الأعراض تساعدنا نحدد الجهاز المتأثر ونختار modality مناسبة."
      },
      {
        "title": "هل المريض حامل أو ممكن يكون في حمل؟",
        "desc": "سؤال أساسي قبل بعض فحوصات الأشعة، خصوصاً الفحوصات التي تستخدم ionizing radiation."
      },
      {
        "title": "هل عنده حساسية من contrast أو مشاكل بالكلى؟",
        "desc": "مهم قبل إعطاء iodinated contrast، خصوصاً عند مرضى kidney dysfunction أو وجود history of contrast reaction."
      },
      {
        "title": "هل تعرض لإصابة أو عملية سابقة؟",
        "desc": "Trauma وprevious surgery قد يغيران التشخيصات المحتملة وتفسير الصور."
      }
    ],
    "examText": "بفحص الأشعة، أول تريك هو لا تقرأ الصورة عشوائياً. ابدأ بـ <span class='eng'>ABCDE</span>: A = Airway، B = Breathing، C = Cardiac/mediastinum، D = Diaphragm، E = Everything else. في chest X-ray تأكد من patient identity وprojection وrotation وinspiration، ثم اقرأ systematically من soft tissues والعظام إلى lungs وpleura ثم heart وmediastinum. واسأل دائماً: هل الصورة technically adequate؟ وهل الموجود يتوافق مع الحالة السريرية؟",
    "redFlags": [
      {
        "title": "Tension pneumothorax",
        "desc": "إذا كان المريض غير مستقر مع علامات tension pneumothorax، لا تنتظر X-ray؛ التدخل العاجل أهم من تأكيد التشخيص بالتصوير."
      },
      {
        "title": "نزيف داخلي أو إصابة شديدة بعد Trauma",
        "desc": "Hemodynamic instability مع suspected internal bleeding يحتاج تقييم سريع وتنسيق مباشر مع فريق trauma والجراحة."
      },
      {
        "title": "انسداد أو انثقاب حاد",
        "desc": "Free intraperitoneal air، bowel obstruction مع deterioration، أو علامات ischemia تحتاج تصعيداً سريعاً."
      },
      {
        "title": "Pulmonary embolism شديد",
        "desc": "ضيق نفس مفاجئ مع hypoxemia أو hypotension أو علامات shock يحتاج تقييم عاجل؛ لا تجعل انتظار التصوير يؤخر إنقاذ المريض."
      }
    ],
    "drugs": [
      {
        "title": "Iodinated contrast",
        "desc": "مادة تباين تُستخدم في CT وبعض الفحوصات لتوضيح الأوعية والأعضاء والآفات؛ لازم تقييم renal function وhistory of contrast reaction حسب الحالة."
      },
      {
        "title": "Gadolinium-based contrast",
        "desc": "مادة تباين تُستخدم في MRI لتحسين إظهار بعض الأنسجة والآفات، وتُستخدم بعد تقييم ملاءمتها للمريض."
      },
      {
        "title": "مهدئات أو مسكنات عند الحاجة",
        "desc": "قد تُستخدم في حالات مختارة لتسهيل بعض إجراءات التصوير أو تقليل الألم، مع مراقبة المريض حسب الدواء والحالة."
      }
    ],
    "pimping": {
      "question": "إذا أعطاك الأخصائي Chest X-ray وقال لك اقرأها، من وين تبدأ؟",
      "answer": "أولاً أتأكد من patient وview وtechnical quality، وبعدها أقرأها بشكل systematic باستخدام ABCDE، وما بقفز مباشرة للـ abnormality اللي لفتت نظري."
    }
  },
  "النفسي": {
    "patientInfo": "مريض حضر إلى قسم الطب النفسي <span class='eng'>Psychiatry</span> بسبب تغير في المزاج أو السلوك أو التفكير، ويحتاج إلى تقييم منظم للحالة العقلية، الخطورة على نفسه أو الآخرين، واستبعاد الأسباب الطبية أو المرتبطة بالمواد.",
    "differentials": [
      {
        "title": "الاكتئاب الشديد <span class='eng'>Major Depressive Disorder (MDD)</span>",
        "desc": "مزاج منخفض أو فقدان المتعة لمدة أسبوعين أو أكثر مع أعراض مثل اضطراب النوم والشهية، التعب، ضعف التركيز أو أفكار الموت."
      },
      {
        "title": "الاضطراب ثنائي القطب <span class='eng'>Bipolar Disorder</span>",
        "desc": "وجود نوبات اكتئاب مع نوبات mania أو hypomania؛ الـ mania تتميز بمزاج مرتفع أو عصبي مع قلة الحاجة للنوم، زيادة الكلام والنشاط والاندفاع."
      },
      {
        "title": "الفصام <span class='eng'>Schizophrenia</span>",
        "desc": "يتميز بأعراض ذهانية مثل hallucinations وdelusions واضطراب التفكير والسلوك، مع تراجع في الأداء الوظيفي."
      },
      {
        "title": "الهذيان <span class='eng'>Delirium</span>",
        "desc": "تغير حاد ومتقلب في الانتباه والوعي مع اضطراب الإدراك؛ نفكر دائماً بسبب طبي أو دوائي خصوصاً إذا بدأ بشكل مفاجئ."
      }
    ],
    "history": [
      {
        "title": "شو المشكلة الأساسية ومتى بدأت؟",
        "desc": "نحدد onset والمدة والتطور؛ البداية الحادة والمتقلبة تجعلنا نفكر أكثر في delirium أو سبب طبي."
      },
      {
        "title": "كيف صار نومك ومزاجك وشهيتك؟",
        "desc": "اضطراب النوم والمزاج والشهية من الأعراض الأساسية في mood disorders."
      },
      {
        "title": "هل فقدت الاهتمام أو المتعة بالأشياء التي كنت تحبها؟",
        "desc": "Anhedonia من أهم أعراض major depression."
      },
      {
        "title": "هل مرّ عليك وقت كنت فيه ما تحتاج تنام كثير، وتحكي أو تتحرك أكثر من المعتاد؟",
        "desc": "سؤال مهم لاكتشاف mania أو hypomania، وبالتالي عدم تشخيص bipolar depression على أنه unipolar depression."
      },
      {
        "title": "هل تسمع أصواتاً أو تشعر أن أحداً يراقبك أو يريد إيذاءك؟",
        "desc": "نبحث عن hallucinations وdelusions والأعراض الذهانية."
      },
      {
        "title": "هل فكرت تؤذي نفسك أو تنتحر؟ وهل عندك خطة؟",
        "desc": "هذا سؤال أساسي لتقييم suicide risk؛ نسأل عن الفكرة، الخطة، الوسيلة، النية والمحاولات السابقة."
      },
      {
        "title": "هل تستخدم كحولاً أو مخدرات أو أدوية معينة؟",
        "desc": "Substance use أو withdrawal قد يسبب أو يزيد الأعراض النفسية، وبعض الأدوية قد تسبب psychiatric symptoms."
      },
      {
        "title": "هل لديك أمراض طبية أو أعراض عصبية جديدة؟",
        "desc": "بعض الأمراض مثل thyroid disease، epilepsy، infections أو metabolic disturbances قد تظهر بأعراض نفسية."
      }
    ],
    "examText": "ابدأ بـ <span class='eng'>Mental Status Examination (MSE)</span>: راقب appearance وbehaviour، ثم speech من حيث rate وvolume، وبعدها mood وaffect. قيّم thought form وthought content، خصوصاً delusions وsuicidal thoughts. اسأل عن hallucinations، ثم افحص cognition: orientation، attention وmemory. قيّم insight وjudgment. بالتوازي، لا تنسَ physical examination وvital signs عندما تكون الأعراض جديدة أو غير مفسرة، لأن بعض الحالات الطبية قد تقلد المرض النفسي.",
    "redFlags": [
      {
        "title": "خطر الانتحار أو إيذاء الآخرين",
        "desc": "Suicidal intent مع خطة أو وسيلة متاحة، محاولة حديثة، أو homicidal intent يستدعي تقييم خطورة عاجلاً وتأمين المريض."
      },
      {
        "title": "هياج شديد أو ذهان حاد",
        "desc": "Severe agitation، عدوانية، فقدان السيطرة أو psychosis مع خطر على النفس أو الآخرين يحتاج تدخلاً فورياً."
      },
      {
        "title": "تغير حاد في الوعي أو الانتباه",
        "desc": "Acute fluctuating confusion أو impaired attention يرجح delirium ويجب البحث عن سبب طبي عاجل بدلاً من افتراض أنه مرض نفسي أولي."
      },
      {
        "title": "أعراض عصبية أو طبية جديدة",
        "desc": "Seizure، focal neurological deficit، severe headache، fever أو abnormal vital signs قد تشير إلى سبب عضوي خطير."
      }
    ],
    "drugs": [
      {
        "title": "مضادات الاكتئاب <span class='eng'>SSRIs</span>",
        "desc": "مثل sertraline، وتُستخدم كخيار شائع في الاكتئاب واضطرابات القلق؛ تأثيرها العلاجي يحتاج عادة عدة أسابيع."
      },
      {
        "title": "مضادات الذهان <span class='eng'>Antipsychotics</span>",
        "desc": "تُستخدم لعلاج psychosis وschizophrenia، وبعضها يستخدم في mania أو حالات أخرى حسب التشخيص."
      },
      {
        "title": "الليثيوم <span class='eng'>Lithium</span>",
        "desc": "Mood stabilizer مهم في bipolar disorder، ويحتاج monitoring لمستوى الدواء ووظائف الكلى والغدة الدرقية والتداخلات الدوائية."
      },
      {
        "title": "البنزوديازيبينات <span class='eng'>Benzodiazepines</span>",
        "desc": "قد تُستخدم لفترة قصيرة في حالات مختارة مثل acute severe agitation أو بعض أنواع withdrawal، مع الانتباه لخطر sedation والاعتماد."
      }
    ],
    "pimping": {
      "question": "مريض نفسي قدامك؛ شو أهم سؤال لازم تسأله حتى لو ما شكيت بالاكتئاب؟",
      "answer": "لازم أسأل مباشرة عن suicidal thoughts، وهل عنده plan أو intent أو access to means؛ تقييم safety هو الأولوية قبل الغوص بالتشخيص النفسي."
    }
  },
  "الشرعي": {
    "patientInfo": "حالة في الطب الشرعي <span class='eng'>Forensic Medicine</span> تتطلب تقييم إصابة أو وفاة بطريقة طبية وقانونية، مع توثيق دقيق للعلامات والأدلة والمحافظة على سلسلة حيازة الأدلة.",
    "differentials": [
      {
        "title": "إصابة رضّية <span class='eng'>Blunt Force Trauma</span>",
        "desc": "تنتج عن جسم غير حاد مثل السقوط أو الضرب أو حوادث السير؛ نبحث عن bruises، abrasions وlacerations ونربطها بالقصة."
      },
      {
        "title": "إصابة بأداة حادة <span class='eng'>Sharp Force Injury</span>",
        "desc": "تنتج عن جسم حاد مثل السكين؛ الجرح غالباً يكون incised wound أو stab wound، ونصف صفاته دون الجزم بالأداة من شكل الجرح وحده."
      },
      {
        "title": "الاختناق الميكانيكي <span class='eng'>Mechanical Asphyxia</span>",
        "desc": "يشمل حالات مثل strangulation أو smothering؛ التشخيص يعتمد على القصة ومسرح الحادث والتشريح والنتائج المساندة، وليس على علامة واحدة."
      },
      {
        "title": "التسمم <span class='eng'>Poisoning</span>",
        "desc": "نفكر فيه عند وجود أعراض غير مفسرة أو تعرض محتمل لمادة سامة؛ نحتاج history دقيقاً، عينات مناسبة وتحاليل toxicology عند اللزوم."
      }
    ],
    "history": [
      {
        "title": "شو صار بالضبط ومتى وأين؟",
        "desc": "نحدد timeline والظروف المحيطة بالحادث ونقارن القصة مع الموجود بالفحص."
      },
      {
        "title": "هل كانت الإصابة سقوطاً أم ضربة أم حادث سير؟",
        "desc": "آلية الإصابة <span class='eng'>Mechanism of injury</span> تساعدنا نتوقع نوع ومكان الإصابات."
      },
      {
        "title": "هل فقد المريض الوعي أو حدث تشنج أو قيء؟",
        "desc": "مهم خصوصاً في إصابات الرأس لتقييم احتمال traumatic brain injury."
      },
      {
        "title": "هل تناول دواء أو مادة أو كحول قبل الحدث؟",
        "desc": "يساعد في تقييم poisoning أو intoxication وقد يفسر تغير الوعي أو الوفاة."
      },
      {
        "title": "هل توجد أمراض مزمنة أو أدوية مثل anticoagulants؟",
        "desc": "بعض الأمراض والأدوية قد تزيد النزيف أو تغير تفسير الإصابات."
      },
      {
        "title": "من الذي وجد المريض وما الظروف المحيطة؟",
        "desc": "في الطب الشرعي، collateral history ومعلومات scene قد تكون أساسية لفهم ملابسات الإصابة أو الوفاة."
      }
    ],
    "examText": "في الفحص الشرعي أهم إشي <span class='eng'>DO NOT ALTER THE EVIDENCE</span>. وثّق حالة المريض أو الجثمان قبل التنظيف أو إزالة الملابس عندما يكون ذلك مناسباً، وسجّل vital signs والحالة العامة. افحص الإصابات بشكل منهجي: الموقع، العدد، الحجم، الشكل، الاتجاه، اللون والصفات المميزة، مع استخدام body diagrams والتصوير وفق البروتوكول. في الجروح سجّل هل هي abrasion أو contusion أو laceration أو incised/stab wound. لا تحاول تحديد الأداة أو سبب الإصابة من شكل الجرح وحده. اجمع الأدلة بطريقة صحيحة واحفظ <span class='eng'>chain of custody</span>.",
    "redFlags": [
      {
        "title": "عدم استقرار أو إصابة مهددة للحياة",
        "desc": "في المريض الحي، ABC الأولوية دائماً؛ لا يجوز أن يؤخر الفحص الشرعي إنقاذ الحياة."
      },
      {
        "title": "اشتباه اعتداء أو جريمة",
        "desc": "الإصابات غير المتوافقة مع القصة، defensive injuries أو ظروف مشبوهة تستدعي توثيقاً دقيقاً وحفظ الأدلة وإبلاغ الجهات المختصة حسب القانون المحلي."
      },
      {
        "title": "وفاة غير متوقعة أو غير طبيعية",
        "desc": "الوفاة العنيفة، المفاجئة غير المفسرة أو المشتبه بها تحتاج التعامل معها كـ <span class='eng'>medicolegal case</span> وفق النظام المحلي."
      },
      {
        "title": "احتمال تسمم",
        "desc": "Altered consciousness أو seizures أو respiratory depression مع تعرض محتمل لمادة سامة يحتاج تدبيراً طبياً عاجلاً مع حفظ العينات المناسبة للتحليل."
      }
    ],
    "drugs": [
      {
        "title": "لا يوجد دواء شرعي ثابت",
        "desc": "الطب الشرعي يعتمد أساساً على التقييم والتوثيق وحفظ الأدلة؛ العلاج في المريض الحي يكون حسب الإصابة والحالة."
      },
      {
        "title": "ترياق <span class='eng'>Antidote</span>",
        "desc": "يُعطى فقط عند الاشتباه بتسمم محدد ووجود indication مناسب؛ مثل naloxone في opioid toxicity مع respiratory depression."
      },
      {
        "title": "لقاح الكزاز <span class='eng'>Tetanus vaccine</span>",
        "desc": "يُعطى حسب نوع الجرح وتاريخ التطعيم في الإصابات المناسبة، كجزء من الرعاية الطبية وليس كعلاج للجرح نفسه."
      },
      {
        "title": "مسكنات الألم <span class='eng'>Analgesics</span>",
        "desc": "تُستخدم لعلاج الألم حسب الإصابة والحالة، مع عدم السماح للتوثيق الشرعي أن يؤخر علاج المريض."
      }
    ],
    "pimping": {
      "question": "شو أهم قاعدة في فحص حالة الطب الشرعي؟",
      "answer": "أولاً أنقذ حياة المريض إذا كان حياً وغير مستقر، وبعدها وثّق بشكل دقيق ومنهجي وحافظ على الأدلة و<span class='eng'>chain of custody</span>؛ ولا تستنتج سبب الإصابة من علامة واحدة."
    }
  },
  "النسائية والتوليد": {
    "patientInfo": "مريضة حامل حضرت إلى قسم النسائية والتوليد بسبب عرض حاد مثل ألم أسفل البطن أو نزيف مهبلي أو تقلصات؛ الأولوية تحديد عمر الحمل، استقرار الأم والجنين، ثم استبعاد الحالات obstetric emergencies.",
    "differentials": [
      {
        "title": "انفصال المشيمة المبكر <span class='eng'>Placental Abruption</span>",
        "desc": "نزيف مهبلي غالباً مع ألم بطني مفاجئ ورحم مؤلم أو متوتر، وقد يحدث حتى مع نزيف خارجي قليل بسبب النزيف المخفي."
      },
      {
        "title": "المشيمة المنزاحة <span class='eng'>Placenta Previa</span>",
        "desc": "تسبب غالباً نزيفاً مهبلياً أحمر فاتحاً وغير مؤلم في النصف الثاني من الحمل؛ لا نعمل digital vaginal examination قبل استبعادها."
      },
      {
        "title": "المخاض المبكر <span class='eng'>Preterm Labor</span>",
        "desc": "تقلصات رحمية منتظمة مع تغير في عنق الرحم قبل 37 أسبوعاً؛ نسأل عن frequency وduration للتقلصات ونبحث عن cervical change."
      },
      {
        "title": "تمزق الأغشية <span class='eng'>Rupture of Membranes</span>",
        "desc": "تشعر المريضة بخروج سائل مهبلي مفاجئ أو مستمر؛ نحدد لون ورائحة السائل ونبحث عن علامات infection أو fetal compromise."
      }
    ],
    "history": [
      {
        "title": "كم عمر الحمل؟ وما تاريخ آخر دورة شهرية؟",
        "desc": "عمر الحمل يغيّر الـ differential والتدبير بشكل كبير، لذلك هذه من أول المعلومات التي نحتاجها."
      },
      {
        "title": "هل يوجد نزيف مهبلي؟ كم كميته وما لونه؟ وهل معه ألم؟",
        "desc": "نزيف مؤلم يوجه أكثر نحو placental abruption، بينما painless bright-red bleeding يرفع الشك في placenta previa."
      },
      {
        "title": "هل يوجد تقلصات أو ألم أسفل البطن؟",
        "desc": "نسأل عن البداية، الشدة، frequency وduration؛ التقلصات المنتظمة مع cervical change تدعم labor."
      },
      {
        "title": "هل نزل ماء أو سائل من المهبل؟",
        "desc": "نحدد وقت نزول السائل، كميته، لونه ورائحته؛ ونبحث عن rupture of membranes وinfection."
      },
      {
        "title": "هل حركة الجنين طبيعية؟",
        "desc": "نقص fetal movements قد يكون علامة على fetal compromise ويحتاج تقييماً سريعاً."
      },
      {
        "title": "هل يوجد صداع شديد أو زغللة أو ألم في أعلى البطن؟",
        "desc": "هذه أعراض مهمة لاحتمال preeclampsia with severe features."
      },
      {
        "title": "هل يوجد تاريخ سابق لقيصرية أو نزيف أو مشاكل في الحمل؟",
        "desc": "الـ obstetric history مهم؛ previous cesarean يرفع احتمالية placenta previa وplacenta accreta spectrum."
      }
    ],
    "examText": "بالراوند ابدأ بتقييم استقرار الأم: <span class='eng'>ABCDE</span>، BP، HR، RR، SpO2 وtemperature، مع خط وريدي إذا كانت الحالة غير مستقرة. قيّم كمية النزيف، علامات shock وabdominal tenderness أو uterine rigidity. افحص الرحم والتقلصات، ثم قيّم fetal heart rate باستخدام <span class='eng'>CTG</span> عندما يكون مناسباً لعمر الحمل والحالة. افحص الأطراف للـ edema وعلامات DVT، وابحث عن علامات preeclampsia. مهم جداً: إذا كان هناك antepartum bleeding، لا تعمل digital vaginal examination حتى يتم استبعاد placenta previa بالسونار.",
    "redFlags": [
      {
        "title": "عدم استقرار الأم <span class='eng'>Maternal instability</span>",
        "desc": "Hypotension، tachycardia، altered mental status أو علامات shock مع النزيف تستدعي استدعاء الفريق فوراً وبدء resuscitation."
      },
      {
        "title": "اضطراب نبض الجنين <span class='eng'>Fetal distress</span>",
        "desc": "Abnormal fetal heart rate أو pathological CTG قد يدل على fetal hypoxia ويحتاج تقييماً وتدخلاً عاجلاً."
      },
      {
        "title": "نزيف مهبلي شديد",
        "desc": "نزيف غزير أو مستمر، خصوصاً مع abdominal pain أو uterine rigidity، قد يشير إلى placental abruption أو سبب خطير آخر."
      },
      {
        "title": "تشنج أو أعراض شديدة لارتفاع الضغط",
        "desc": "Seizure، severe headache، visual symptoms، RUQ/epigastric pain أو severe hypertension قد تشير إلى eclampsia أو severe preeclampsia وتحتاج تدخلاً فورياً."
      }
    ],
    "drugs": [
      {
        "title": "مغنيسيوم سلفات <span class='eng'>Magnesium Sulfate</span>",
        "desc": "يُستخدم للوقاية من التشنجات أو علاجها في severe preeclampsia/eclampsia، مع مراقبة reflexes والتنفس والبول."
      },
      {
        "title": "أوكسيتوسين <span class='eng'>Oxytocin</span>",
        "desc": "يحفز انقباض الرحم ويُستخدم في induction/augmentation في حالات مختارة، وكذلك لعلاج uterine atony المسبب لـ postpartum hemorrhage."
      },
      {
        "title": "حمض الترانيكساميك <span class='eng'>Tranexamic Acid</span>",
        "desc": "يُستخدم مبكراً في postpartum hemorrhage كجزء من تدبير النزيف، بالإضافة إلى resuscitation والسيطرة على مصدر النزيف."
      },
      {
        "title": "كورتيكوستيرويدات <span class='eng'>Antenatal Corticosteroids</span>",
        "desc": "مثل betamethasone، تُستخدم عند وجود خطر ولادة مبكرة ضمن العمر الحملي المناسب لتقليل neonatal respiratory morbidity."
      }
    ],
    "pimping": {
      "question": "حامل عندها antepartum bleeding؛ شو أهم فحص ممنوع تعمله قبل ما تستبعد placenta previa؟",
      "answer": "Digital vaginal examination ممنوع قبل استبعاد placenta previa، لأنه ممكن يسبب catastrophic hemorrhage إذا كانت المشيمة تغطي عنق الرحم."
    }
  },
  "الجراحة": {
    "patientInfo": "مريض حضر إلى قسم الجراحة بشكوى حادة مثل ألم البطن أو القيء أو انتفاخ البطن، ويحتاج لتقييم سريع لمعرفة هل توجد حالة جراحية طارئة أم يمكن تدبيرها تحفظياً.",
    "differentials": [
      {
        "title": "التهاب الزائدة الدودية الحاد <span class='eng'>Acute Appendicitis</span>",
        "desc": "ألم يبدأ غالباً حول السرة ثم ينتقل إلى الربع السفلي الأيمن، مع فقدان الشهية والغثيان وقد توجد حرارة."
      },
      {
        "title": "انسداد الأمعاء <span class='eng'>Intestinal Obstruction</span>",
        "desc": "نفكر فيه مع مغص بطني، قيء، انتفاخ وعدم خروج الغازات أو البراز؛ وجود عمليات بطن سابقة يرفع احتمال adhesions."
      },
      {
        "title": "التهاب المرارة الحاد <span class='eng'>Acute Cholecystitis</span>",
        "desc": "ألم في الربع العلوي الأيمن، غالباً بعد الأكل الدسم، وقد يمتد للكتف الأيمن مع fever وpositive Murphy sign."
      },
      {
        "title": "ثقب الأحشاء <span class='eng'>Perforated Viscus</span>",
        "desc": "ألم بطني شديد ومفاجئ مع guarding وrigidity؛ قد يؤدي إلى peritonitis وsepsis، لذلك هو surgical emergency."
      }
    ],
    "history": [
      {
        "title": "أين بدأ الألم وأين أصبح الآن؟",
        "desc": "موقع الألم وانتقاله مهمان جداً؛ مثلاً انتقال الألم من حول السرة إلى الربع السفلي الأيمن يدعم appendicitis."
      },
      {
        "title": "متى بدأ الألم وهل هو مستمر أم مغصي؟",
        "desc": "الألم colicky يوحي أكثر بالانسداد أو المغص، بينما الألم المستمر مع تهيج الصفاق أكثر خطورة."
      },
      {
        "title": "هل يوجد قيء؟ وما لونه ومتى بدأ بالنسبة للألم؟",
        "desc": "القيء المتكرر مهم في obstruction، والقيء الأخضر <span class='eng'>bilious vomiting</span> قد يدل على انسداد distal to the ampulla."
      },
      {
        "title": "متى كانت آخر مرة خرج فيها البراز أو الغازات؟",
        "desc": "عدم خروج stool أو flatus مع الانتفاخ والقيء يدعم intestinal obstruction."
      },
      {
        "title": "هل سبق للمريض أن أجرى عملية في البطن؟",
        "desc": "التاريخ الجراحي مهم جداً لأن adhesions من الأسباب الشائعة لانسداد الأمعاء الدقيقة."
      },
      {
        "title": "هل يوجد دم في القيء أو البراز؟",
        "desc": "يساعد في تقييم GI bleeding أو bowel ischemia وغيرها من الحالات الخطيرة."
      },
      {
        "title": "هل توجد أمراض مزمنة أو أدوية مهمة؟",
        "desc": "اسأل خصوصاً عن anticoagulants، NSAIDs، diabetes وأمراض القلب والكلى لأنها تؤثر على التشخيص والتحضير للجراحة."
      }
    ],
    "examText": "بالراوند الجراحي ابدأ بـ <span class='eng'>general appearance</span> وvital signs: هل المريض stable أم septic/shocked؟ افحص البطن بالترتيب: <span class='eng'>inspection</span> للانتفاخ والندبات والفتوق، ثم <span class='eng'>auscultation</span> لأصوات الأمعاء، ثم <span class='eng'>percussion</span>، وأخيراً <span class='eng'>palpation</span> بلطف مع تحديد tenderness وguarding وrigidity وrebound tenderness. افحص جميع مناطق الفتق، ولا تنسَ فحص PR أو pelvic examination عندما يكون مناسباً للحالة. أهم شيء بالجراحة: لا تكتفي بمكان الألم؛ ابحث عن علامات <span class='eng'>peritonitis</span> وعدم الاستقرار.",
    "redFlags": [
      {
        "title": "علامات التهاب الصفاق <span class='eng'>Peritonitis</span>",
        "desc": "Guarding، rigidity أو rebound tenderness مع ألم شديد قد تعني perforation أو intra-abdominal infection وتحتاج تقييماً جراحياً عاجلاً."
      },
      {
        "title": "عدم الاستقرار أو الصدمة",
        "desc": "Hypotension، tachycardia، altered mental status أو poor perfusion قد تشير إلى sepsis أو bleeding أو perforation."
      },
      {
        "title": "ألم شديد مفاجئ وغير متناسب",
        "desc": "Pain out of proportion to examination يرفع الشك في mesenteric ischemia، وهي حالة لا يجب تأخير تقييمها."
      },
      {
        "title": "انسداد مع تدهور سريري",
        "desc": "انتفاخ شديد مع persistent vomiting، عدم خروج الغازات، fever، tachycardia أو peritoneal signs قد يدل على strangulation أو bowel ischemia."
      }
    ],
    "drugs": [
      {
        "title": "مسكنات الألم <span class='eng'>Analgesics</span>",
        "desc": "يجب إعطاء adequate analgesia مثل paracetamol أو opioids حسب شدة الألم والحالة؛ إعطاء المسكن لا يلغي ضرورة إعادة الفحص."
      },
      {
        "title": "مضادات حيوية <span class='eng'>Antibiotics</span>",
        "desc": "تُستخدم عند وجود suspected intra-abdominal infection أو perforation أو قبل بعض العمليات حسب التشخيص والبروتوكول المحلي."
      },
      {
        "title": "سوائل وريدية <span class='eng'>IV isotonic fluids</span>",
        "desc": "مهمة عند dehydration، vomiting أو shock مع مراقبة urine output، الضغط والكهارل."
      },
      {
        "title": "مضادات القيء <span class='eng'>Antiemetics</span>",
        "desc": "يمكن استخدامها لتخفيف nausea/vomiting بعد تقييم السبب، مع الانتباه إلى أن استمرار القيء قد يكون علامة على obstruction يحتاج تدبيراً جراحياً."
      }
    ],
    "pimping": {
      "question": "مريض عنده acute abdomen؛ شو أهم علامة بالفحص بتخليك تفكر إن الموضوع surgical emergency؟",
      "answer": "وجود peritoneal signs مثل guarding وrigidity وrebound tenderness، خصوصاً إذا ترافق معها systemic instability؛ وقتها أفكر بperitonitis وأصعّد التقييم الجراحي فوراً."
    }
  },
  "الباطني": {
    "patientInfo": "مريض بالغ حضر إلى قسم الباطنية بسبب شكوى حادة أو تدهور في حالة مزمنة؛ الأولوية هي تقييم الاستقرار، أخذ history موجه، ثم تحديد الـ differential diagnosis وربطه بالفحص والفحوصات.",
    "differentials": [
      {
        "title": "عدوى جهازية أو إنتان <span class='eng'>Sepsis</span>",
        "desc": "نفكر فيها عند وجود infection مع تدهور عام أو علامات organ dysfunction مثل hypotension، altered mental status أو oliguria."
      },
      {
        "title": "متلازمة الشريان التاجي الحادة <span class='eng'>Acute Coronary Syndrome (ACS)</span>",
        "desc": "مهمة خصوصاً مع chest pain أو ضيق نفس أو تعرق وغثيان؛ قد تكون الأعراض غير نمطية، خاصة عند كبار السن ومرضى السكري."
      },
      {
        "title": "الانصمام الرئوي <span class='eng'>Pulmonary Embolism (PE)</span>",
        "desc": "نفكر فيه مع ضيق نفس مفاجئ، pleuritic chest pain، tachycardia أو hypoxemia، خصوصاً مع عوامل خطر مثل immobilization أو malignancy."
      },
      {
        "title": "فشل القلب الحاد <span class='eng'>Acute Heart Failure</span>",
        "desc": "يرجحه ضيق النفس مع orthopnea أو PND، crackles، peripheral edema أو elevated JVP."
      }
    ],
    "history": [
      {
        "title": "ما هي الشكوى الرئيسية ومتى بدأت؟",
        "desc": "حدد الـ onset والتطور والمدة؛ البداية المفاجئة تختلف عن التدريجية وتضيّق الـ differential."
      },
      {
        "title": "ما طبيعة الألم أو العرض الأساسي؟",
        "desc": "اسأل عن الموقع، طبيعة الألم، radiation، severity، aggravating/relieving factors والأعراض المصاحبة؛ هذه التفاصيل قد تكون مفتاح التشخيص."
      },
      {
        "title": "هل يوجد ضيق نفس أو chest pain أو palpitations أو syncope؟",
        "desc": "هذه أعراض مهمة لاحتمال وجود cardiac أو pulmonary emergency."
      },
      {
        "title": "هل توجد حرارة أو سعال أو dysuria أو أي مصدر محتمل للعدوى؟",
        "desc": "يساعد في تحديد source of infection وتقييم احتمال sepsis."
      },
      {
        "title": "ما الأمراض المزمنة والأدوية التي يأخذها المريض؟",
        "desc": "ركز على diabetes، hypertension، heart disease، CKD، COPD وأدوية مثل anticoagulants والـ insulin لأنها تغير التشخيص والعلاج."
      },
      {
        "title": "هل يوجد سفر، immobilization، عملية حديثة أو تاريخ سابق للجلطات؟",
        "desc": "هذه أسئلة ذهبية عند تقييم احتمال <span class='eng'>DVT/PE</span>."
      },
      {
        "title": "هل حدث تغير في كمية البول أو الأكل والشرب أو مستوى الوعي؟",
        "desc": "قلة البول قد تشير إلى renal hypoperfusion، وتغير الوعي قد يكون علامة على systemic illness أو organ dysfunction."
      }
    ],
    "examText": "بالراوند ابدأ من شكل المريض العام: هل هو <span class='eng'>well-looking</span> أم <span class='eng'>toxic-looking</span>؟ خذ vital signs كاملة: BP، HR، RR، temperature وSpO2. طبّق <span class='eng'>ABCDE</span> إذا كان المريض غير مستقر. افحص القلب: JVP، heart sounds، murmurs وperipheral edema. افحص الرئتين: work of breathing، air entry، crackles أو wheeze. افحص البطن، الأطراف للـ edema أو signs of DVT، والجلد للـ pallor، cyanosis، rash أو علامات bleeding. لا تنسَ neurological assessment سريعاً: مستوى الوعي، pupils، وأي focal neurological deficit حسب الشكوى.",
    "redFlags": [
      {
        "title": "عدم الاستقرار الديناميكي الدموي <span class='eng'>Hemodynamic instability</span>",
        "desc": "Hypotension، علامات shock، severe tachycardia أو poor peripheral perfusion تستدعي تصعيد الحالة وتدخلاً عاجلاً."
      },
      {
        "title": "ضيق نفس شديد أو نقص أكسجة",
        "desc": "Severe respiratory distress، cyanosis، انخفاض SpO2 أو exhaustion قد تعني respiratory failure وتحتاج تدخلاً فورياً."
      },
      {
        "title": "تغير حاد في الوعي",
        "desc": "Acute confusion أو reduced level of consciousness قد يدل على hypoxia، hypoglycemia، sepsis أو مشكلة عصبية خطيرة."
      },
      {
        "title": "Chest pain عالي الخطورة",
        "desc": "ألم صدري مع hypotension، arrhythmia، syncope، dynamic ECG changes أو علامات heart failure يحتاج تقييماً عاجلاً لاحتمال ACS أو سبب خطير آخر."
      }
    ],
    "drugs": [
      {
        "title": "أسبرين <span class='eng'>Aspirin</span>",
        "desc": "يُستخدم في حالات ACS المناسبة لتقليل platelet aggregation، بعد تقييم موانع الاستعمال وخطر النزيف."
      },
      {
        "title": "نيتروغليسرين <span class='eng'>Nitroglycerin</span>",
        "desc": "قد يُستخدم لتخفيف ischemic chest pain أو أعراض congestion في حالات مختارة، ويُتجنب عند hypotension وبعض الحالات مثل recent PDE-5 inhibitor use."
      },
      {
        "title": "مدرات البول <span class='eng'>Loop diuretics</span>",
        "desc": "مثل furosemide، وتُستخدم عند وجود fluid overload أو acute pulmonary edema مع مراقبة الضغط، renal function والكهارل."
      },
      {
        "title": "مضادات حيوية <span class='eng'>Antibiotics</span>",
        "desc": "تُعطى عند الاشتباه بعدوى بكتيرية مناسبة، ويُختار النوع حسب مصدر العدوى، شدة الحالة، الحساسية المحلية ووظائف الكلى."
      }
    ],
    "pimping": {
      "question": "مريض بالباطنية وصل وهو تعبان ومش مستقر؛ شو أول approach إلك؟",
      "answer": "أبدأ بـ <span class='eng'>ABCDE</span> وأعالج أي life-threatening problem فوراً، ثم آخذ focused history وأعمل targeted examination؛ ما بستنى نتائج التحاليل قبل ما أعالج الخطر المباشر."
    }
  },
  "الطوارئ": {
    "patientInfo": "طفل حضر إلى قسم الطوارئ بحالة حادة؛ الأولوية في الراوند هي تقييم الاستقرار بسرعة وفق <span class='eng'>ABCDE</span>، تحديد وجود حالة مهددة للحياة، ثم البحث عن السبب.",
    "differentials": [
      {
        "title": "الإنتان الشديد <span class='eng'>Sepsis / Septic shock</span>",
        "desc": "نفكر فيه عند طفل يبدو مريضاً مع حرارة أو مصدر عدوى، خصوصاً مع تغير الوعي، تسرع القلب، ضعف التروية أو انخفاض الضغط."
      },
      {
        "title": "نقص حجم الدم <span class='eng'>Hypovolemic shock</span>",
        "desc": "يظهر غالباً مع جفاف شديد، قيء أو إسهال أو نزيف، ونبحث عن tachycardia، delayed capillary refill وبرودة الأطراف وقلة البول."
      },
      {
        "title": "التأق <span class='eng'>Anaphylaxis</span>",
        "desc": "بداية مفاجئة بعد طعام أو دواء أو لسعة، مع صعوبة تنفس أو wheeze أو تورم أو علامات ضعف الدورة الدموية؛ وجود مشكلة في مجرى الهواء مهم جداً."
      },
      {
        "title": "نوبة ربو شديدة <span class='eng'>Severe asthma exacerbation</span>",
        "desc": "تظهر بضيق نفس وwheeze وزيادة جهد التنفس؛ في الحالة الشديدة قد يقل دخول الهواء أو يصبح الصدر صامتاً، وهذه علامة خطيرة."
      }
    ],
    "history": [
      {
        "title": "متى بدأت المشكلة وكيف تطورت؟",
        "desc": "الزمن وسرعة التدهور يساعدان على التفريق بين الحالات الحادة جداً مثل anaphylaxis وبين العدوى أو الجفاف."
      },
      {
        "title": "هل الطفل واعٍ ويتفاعل بشكل طبيعي؟",
        "desc": "تغير مستوى الوعي قد يدل على نقص الأكسجة أو نقص التروية أو hypoglycemia أو مشكلة عصبية خطيرة."
      },
      {
        "title": "هل يوجد صعوبة تنفس أو زرقة أو توقف بالتنفس؟",
        "desc": "هذا يحدد خطورة مشكلة airway أو breathing ويحدد الحاجة لتدخل فوري."
      },
      {
        "title": "هل يوجد قيء أو إسهال أو نزيف أو قلة بول؟",
        "desc": "نبحث عن فقدان السوائل أو الدم ونقيّم احتمال hypovolemic shock."
      },
      {
        "title": "هل توجد حرارة أو مصدر عدوى معروف؟",
        "desc": "يساعدنا في تقييم احتمال sepsis وتحديد مصدر العدوى."
      },
      {
        "title": "هل تعرض الطفل لطعام أو دواء أو لسعة جديدة؟",
        "desc": "سؤال مهم جداً عند الاشتباه بـ anaphylaxis."
      },
      {
        "title": "هل لديه أمراض مزمنة أو أدوية منتظمة؟",
        "desc": "خصوصاً asthma، congenital heart disease، diabetes أو أمراض المناعة؛ لأنها تغير التشخيص والتدبير."
      }
    ],
    "examText": "في طوارئ الأطفال لا تبدأ بفحص طويل؛ ابدأ من بعيد بـ <span class='eng'>general appearance</span>: هل الطفل alert أم lethargic؟ ثم طبّق <span class='eng'>ABCDE</span>: <span class='eng'>A - Airway</span>: هل مجرى الهواء مفتوح؟ هل يوجد stridor أو إفرازات؟ <span class='eng'>B - Breathing</span>: معدل التنفس، SpO2، chest retractions، nasal flaring، auscultation. <span class='eng'>C - Circulation</span>: HR، BP، capillary refill، النبض، لون وحرارة الأطراف. <span class='eng'>D - Disability</span>: مستوى الوعي وقياس glucose سريعاً. <span class='eng'>E - Exposure</span>: افحص الجلد، الطفح، الحرارة وأي إصابة أو مصدر واضح للمشكلة مع المحافظة على تدفئة الطفل. إذا وجدت مشكلة مهددة للحياة عالجها فوراً ولا تنتظر إكمال بقية الفحص.",
    "redFlags": [
      {
        "title": "انسداد أو فشل مجرى الهواء",
        "desc": "Stridor شديد، عدم القدرة على حماية airway، زرقة أو توقف التنفس يستدعي تدخل الطوارئ فوراً."
      },
      {
        "title": "فشل تنفسي",
        "desc": "Severe retractions، انخفاض SpO2، exhaustion، apnea أو silent chest علامات خطيرة وتحتاج تدخلاً عاجلاً."
      },
      {
        "title": "صدمة أو ضعف تروية",
        "desc": "Delayed capillary refill، نبض ضعيف، برودة الأطراف، altered mental status أو hypotension علامات تستدعي تصعيد الحالة فوراً."
      },
      {
        "title": "تغير الوعي أو تشنج",
        "desc": "Altered consciousness أو seizure قد ينتج عن hypoglycemia أو hypoxia أو sepsis أو سبب عصبي خطير ويحتاج تقييماً عاجلاً."
      }
    ],
    "drugs": [
      {
        "title": "أدرينالين <span class='eng'>Epinephrine</span>",
        "desc": "الدواء الأول في anaphylaxis؛ يُعطى فوراً عند وجود anaphylaxis ولا ننتظر تطور hypotension."
      },
      {
        "title": "أكسجين <span class='eng'>Oxygen</span>",
        "desc": "يُعطى عند وجود hypoxemia أو respiratory failure حسب الحالة، مع مراقبة SpO2 والاستجابة."
      },
      {
        "title": "محاليل وريدية <span class='eng'>IV isotonic fluids</span>",
        "desc": "تُستخدم عند وجود shock أو significant dehydration مع إعادة التقييم المتكرر لتجنب fluid overload، خصوصاً في بعض الأطفال ذوي أمراض القلب أو الكلى."
      },
      {
        "title": "سالبيوتامول <span class='eng'>Salbutamol</span>",
        "desc": "موسّع قصبي يُستخدم في acute asthma exacerbation لتخفيف bronchospasm."
      }
    ],
    "pimping": {
      "question": "طفل دخل الطوارئ ويبدو مريضاً جداً، شو أول إشي بتعمله؟",
      "answer": "أبدأ فوراً بـ <span class='eng'>ABCDE assessment</span>، وأعالج أي مشكلة مهددة للحياة بمجرد اكتشافها؛ في الطوارئ عند الطفل unstable أهم شيء هو recognition and immediate stabilization، وليس أخذ history طويل أولاً."
    }
  }
};
// ════════════════════════════════════════════════
//  ROUND PREPARATION GENERATOR
//  10-minute clinical warm-up before rounds: pick a specialty (or paste
//  an AI-generated JSON for "Today's Patients") and get Top Differentials,
//  golden history questions, exam tricks, red flags, key drugs, and a
//  pimping Q&A — styled to match the reference design (pink/yellow/blue/
//  green/purple boxes).
//  Storage key: drmonic_roundprep_custom  (user-added/edited specialties)
// ════════════════════════════════════════════════

const RP_KEY = 'drmonic_roundprep_custom';
const RP_LASTVIEW_KEY = 'drmonic_roundprep_last';
let rpCustomData = {};   // user-added or user-edited specialties, same shape as RP_SEED_DATA values
let rpCurrentName = null;
let rpCurrentData = null;

function rpLoadCustom() {
  try { rpCustomData = JSON.parse(localStorage.getItem(RP_KEY)) || {}; } catch (e) { rpCustomData = {}; }
}
function rpSaveCustom() { safeLocalSet(RP_KEY, JSON.stringify(rpCustomData)); }

// Merge built-in seed specialties with any user-added/edited ones (custom wins on name clash)
function rpAllSpecialties() {
  return Object.assign({}, RP_SEED_DATA, rpCustomData);
}

const RP_AI_SYSTEM_INSTRUCTION = `أنت الآن نظام توليد بيانات طبية خاص بمنصة "Dr. Monic" لتحضير الراوندات السريرية (Clinical Warm-up).
المطلوب منك: بناءً على المرض أو الحالة الطبية التي سيطلبها المستخدم، أن تولّد كود JSON نقي ومباشر فقط — بدون أي نص إضافي قبله أو بعده، وبدون أسوار markdown مثل \`\`\`json.

يجب أن يلتزم الـ JSON حصرياً بالهيكل التالي وتعبئة تفاصيله بدقة طبية عالية، بلغة عربية مبسطة مع استخدام المصطلحات الإنجليزية الطبية ضمن وسوم HTML مثل <span class='eng'>Term</span> عند الحاجة:

{
  "patientInfo": "وصف قصير لحالة المريض أو السيناريو الإكلينيكي",
  "differentials": [
    {"title": "اسم التشخيص مع المصطلح بالإنجليزية", "desc": "شرح مبسط جداً وكيف نميزه"},
    {"title": "اسم التشخيص الثاني مع المصطلح بالإنجليزية", "desc": "شرح مبسط جداً"}
  ],
  "history": [
    {"title": "السؤال الأول", "desc": "ليش بنسأله وشو الهدف السريري"},
    {"title": "السؤال الثاني", "desc": "التفصيل الذهبي"}
  ],
  "examText": "التريك الأساسي بالفحص السريري، وكيف نعمله صح بالراوند.",
  "redFlags": [
    {"title": "علامة الخطر الأولى", "desc": "متى نرن على الأخصائي فوراً"},
    {"title": "علامة الخطر الثانية", "desc": "التفصيل"}
  ],
  "drugs": [
    {"title": "اسم الدواء الأول", "desc": "ليش بنعطيه وبأختصار"},
    {"title": "اسم الدواء الثاني", "desc": "الاستعمال"}
  ],
  "pimping": {
    "question": "سؤال كلاسيكي قد يرميه الأخصائي فجأة بالراوند؟",
    "answer": "الجواب القوي والسريع"
  }
}

أرجع الـ JSON فقط، ولا شيء غيره.`;

function showRoundPrepView() {
  hideAllViews();
  document.getElementById('roundPrepView').classList.add('active');
  rpLoadCustom();
  const last = localStorage.getItem(RP_LASTVIEW_KEY);
  const all = rpAllSpecialties();
  rpRenderPicker();
  if (last && all[last]) {
    rpOpenSpecialty(last);
  } else {
    rpShowPicker();
  }
}

function rpShowPicker() {
  document.getElementById('rpPickerArea').style.display = 'block';
  document.getElementById('rpDetailArea').style.display = 'none';
}

function rpRenderPicker() {
  const all = rpAllSpecialties();
  const names = Object.keys(all);
  const icons = {
    'اطفال': '👶', 'الأشعة': '🩻', 'النفسي': '🧠', 'الشرعي': '⚖️',
    'النسائية والتوليد': '🤰', 'الجراحة': '🔪', 'الباطني': '🩺', 'الطوارئ': '🚑'
  };
  const grid = document.getElementById('rpSpecialtyGrid');
  grid.innerHTML = names.map(name => `
    <div class="rp-spec-card" onclick="rpOpenSpecialty('${esc(name).replace(/'/g,"\\'")}')">
      <div class="rp-spec-icon">${icons[name] || '🏥'}</div>
      <div class="rp-spec-name">${esc(name)}</div>
      ${rpCustomData[name] ? '<div class="rp-spec-badge">مخصص</div>' : ''}
    </div>`).join('') + `
    <div class="rp-spec-card rp-spec-add" onclick="rpOpenAiModal(null)">
      <div class="rp-spec-icon">➕</div>
      <div class="rp-spec-name">إضافة / لصق JSON</div>
    </div>`;
}

function rpOpenSpecialty(name) {
  const all = rpAllSpecialties();
  const data = all[name];
  if (!data) { showToast('⚠️ ما لقيت هاد التخصص'); return; }
  rpCurrentName = name;
  rpCurrentData = data;
  localStorage.setItem(RP_LASTVIEW_KEY, name);
  document.getElementById('rpPickerArea').style.display = 'none';
  const area = document.getElementById('rpDetailArea');
  area.style.display = 'block';
  area.innerHTML = rpBuildDetailHtml(name, data);
}

function rpBuildDetailHtml(name, d) {
  const diffs = (d.differentials || []).map(x => `<li><strong>${x.title}:</strong> ${x.desc}</li>`).join('') || '<li>—</li>';
  const hist = (d.history || []).map(x => `<li><strong>${x.title}:</strong> ${x.desc}</li>`).join('') || '<li>—</li>';
  const flags = (d.redFlags || []).map(x => `<li><strong>${x.title}:</strong> ${x.desc}</li>`).join('') || '<li>—</li>';
  const drugs = (d.drugs || []).map(x => `<li><strong>${x.title}:</strong> ${x.desc}</li>`).join('') || '<li>—</li>';
  const pimping = d.pimping || {};

  return `
    <div class="notes-toolbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="rpShowPicker()">← رجوع للتخصصات</button>
        <span style="font-weight:800;">🩺 Round Preparation — ${esc(name)}</span>
      </div>
      <div class="notes-toolbar-right">
        <button class="btn btn-ghost btn-sm" onclick="rpOpenAiModal('${esc(name).replace(/'/g,"\\'")}')">🤖 Today's Patients (AI)</button>
        <button class="btn btn-ghost btn-sm" onclick="rpDeleteCustom('${esc(name).replace(/'/g,"\\'")}')">🗑️ حذف التخصص</button>
      </div>
    </div>

    <div class="rp-container">
      <div class="rp-patientinfo">📌 ${d.patientInfo || 'اضغط "Today\'s Patients" لتوليد سيناريو مخصص'}</div>

      <div class="rp-section-title"><span class="rp-circle">1</span><h2>أهم التشخيصات <small>Top Differentials</small></h2></div>
      <div class="rp-box rp-box-pink">
        <div class="rp-box-title">🚨 الكلمات المفتاحية عشان تلقط التشخيص:</div>
        <ul>${diffs}</ul>
      </div>

      <div class="rp-section-title"><span class="rp-circle">2</span><h2>أسئلة الهيستوري الذهبية</h2></div>
      <div class="rp-box rp-box-yellow">
        <div class="rp-box-title">💡 شو تسأل بالزبط؟</div>
        <ul>${hist}</ul>
      </div>

      <div class="rp-section-title"><span class="rp-circle">3</span><h2>تريكات الفحص السريري</h2></div>
      <div class="rp-box rp-box-blue">
        <div class="rp-box-title">🩺 التريك اللي لازم تعمله بالراوند:</div>
        <div>${d.examText || '—'}</div>
      </div>

      <div class="rp-section-title"><span class="rp-circle">4</span><h2>الـ Red Flags</h2></div>
      <div class="rp-box rp-box-pink">
        <div class="rp-box-title">🚩 إذا شفت هذول رن عالأخصائي طوالي:</div>
        <ul>${flags}</ul>
      </div>

      <div class="rp-section-title"><span class="rp-circle">5</span><h2>أهم الأدوية</h2></div>
      <div class="rp-box rp-box-purple">
        <div class="rp-box-title">💊 أدوية عالسريع:</div>
        <ul>${drugs}</ul>
      </div>

      <div class="rp-section-title"><span class="rp-circle">6</span><h2>أسئلة الأخصائيين اللي برموها فجأة</h2></div>
      <div class="rp-box rp-box-green">
        <div class="rp-box-title">🧠 جهز الجواب عشان تطلع فلتة:</div>
        <div>
          <strong>سؤال الأخصائي:</strong> ${pimping.question || '—'}<br><br>
          <strong>جوابك القوي:</strong> ${pimping.answer || '—'}
        </div>
      </div>
    </div>`;
}

// ── "Today's Patients" AI flow — calls Gemini directly, no copy/paste ──
function rpOpenAiModal(baseName) {
  rpAiTargetName = baseName; // if set, apply into this existing specialty; else create new
  const modal = document.getElementById('rpAiModal');
  modal.style.display = 'flex';
  document.getElementById('rpAiCaseInput').value = '';
  document.getElementById('rpAiNewName').value = baseName || '';
  document.getElementById('rpAiNewNameRow').style.display = baseName ? 'none' : 'block';
  const statusEl = document.getElementById('rpAiStatus');
  if (statusEl) statusEl.textContent = '';
  const btn = document.getElementById('rpAiGenerateBtn');
  if (btn) { btn.disabled = false; btn.textContent = '✨ جهزلي التحضير'; }
}
let rpAiTargetName = null;

function rpCloseAiModal() {
  document.getElementById('rpAiModal').style.display = 'none';
}

async function rpGenerate() {
  const caseText = document.getElementById('rpAiCaseInput').value.trim();
  if (!caseText) { showToast('⚠️ اكتب وصف الحالة أولاً'); return; }

  let targetName = rpAiTargetName;
  if (!targetName) {
    targetName = document.getElementById('rpAiNewName').value.trim();
    if (!targetName) { showToast('⚠️ اكتب اسم للتخصص أو الحالة'); return; }
  }

  const apiKey = aiAssistantGetApiKey();
  const statusEl = document.getElementById('rpAiStatus');
  if (!apiKey) {
    if (statusEl) statusEl.textContent = '⚠️ أدخل Gemini API Key من صفحة الإعدادات ⚙️ (قسم "🤖 المساعد الذكي") أولاً.';
    return;
  }

  const btn = document.getElementById('rpAiGenerateBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحضير...'; }
  if (statusEl) statusEl.textContent = '⏳ بنحضّرلك التحضير، ثواني...';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: AI_ASSISTANT_MODEL,
        system_instruction: RP_AI_SYSTEM_INSTRUCTION,
        input: caseText,
        generation_config: {
          temperature: 0.4,
          max_output_tokens: 1600,
          thinking_level: 'low'
        }
      })
    });
    if (!response.ok) {
      let errorDetail = '';
      try { const errorData = await response.json(); errorDetail = errorData?.error?.message || ''; } catch (e) {}
      throw new Error('Gemini API returned ' + response.status + (errorDetail ? ': ' + errorDetail : ''));
    }
    const data = await response.json();
    let raw = (data.output_text || aiAssistantExtractInteractionText(data) || '').trim();
    // Strip markdown code fences if the model added them anyway
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error('رجع الـ AI رد مش JSON صالح. جرب مرة ثانية أو وضّح وصف الحالة أكثر.');
    }
    rpCustomData[targetName] = parsed;
    rpSaveCustom();
    showToast('🚀 تم التحضير بنجاح');
    rpCloseAiModal();
    rpRenderPicker();
    rpOpenSpecialty(targetName);
  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ تعذر توليد التحضير: ' + err.message;
    console.error('Round Prep AI error:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✨ جهزلي التحضير'; }
  }
}

function rpDeleteCustom(name) {
  if (!rpCustomData[name]) { showToast('⚠️ هاد تخصص أساسي، ما ينحذف'); return; }
  if (!confirm('متأكد إنك بدك تحذف "' + name + '"؟')) return;
  delete rpCustomData[name];
  rpSaveCustom();
  showToast('🗑️ تم الحذف');
  if (localStorage.getItem(RP_LASTVIEW_KEY) === name) localStorage.removeItem(RP_LASTVIEW_KEY);
  rpRenderPicker();
  rpShowPicker();
}
