<?php
require '/home/claude/jl/vendor/autoload.php';
$app = require '/home/claude/jl/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB; use Carbon\Carbon; use Illuminate\Support\Facades\Hash;
mt_srand(42);
$d = json_decode(file_get_contents('/mnt/user-data/uploads/job-labs-prototype/tools/_mock_export.json'), true);
DB::statement('SET FOREIGN_KEY_CHECKS=0');
foreach (['rms_job_adv_template','rms_company_master','rms_user_master','rms_user_company','vacancy_email_notifications','audit_email_logs','audit_vacancy_logs','rms_application_tracking_masters','rms_candidate_masters','rms_label_master','rms_category_master','rms_city','rms_country','rms_job_domain_master','job_vacancy_views','leads','log_activities','support_tickets','support_ticket_replies','interview_schedules','email_templates','campaigns','model_has_roles','model_has_permissions','role_has_permissions','roles','permissions'] as $t) DB::table($t)->truncate();
$now = Carbon::now(); $today = Carbon::today();
$rnd = fn($a,$b) => mt_rand($a,$b);
$pick = fn($arr) => $arr[array_rand($arr)];
// ---- lookups
DB::table('rms_country')->insert(['country_id'=>1,'country_name'=>'Sri Lanka']);
foreach ($d['lookups']['cities'] as $c) DB::table('rms_city')->insert(['city_id'=>$c['city_id'],'city_name'=>$c['city_name'],'country_id'=>1]);
$cats = [1=>['Job Type','JOBTYPE','jobTypes'],2=>['Work Type','WORKTYPE','workTypes'],3=>['Location','LOCATION',null],4=>['Industry Sector','INDUSTRYSECTOR','industrySectors'],5=>['Job Sector','JOBSECTOR','jobSectors']];
foreach ($cats as $id=>[$n,$t,$k]) { DB::table('rms_category_master')->insert(['category_id'=>$id,'category_name'=>$n,'category_type'=>$t,'create_user'=>'admin','create_at'=>'2025-01-10']);
  if ($k) foreach ($d['lookups'][$k] as $l) DB::table('rms_label_master')->insert(['label_id'=>$l['label_id'],'label_name'=>$l['label_name'],'label_category'=>$id,'active'=>'1','create_user'=>'admin','create_at'=>'2025-01-10']); }
DB::table('rms_label_master')->insert(['label_id'=>900,'label_name'=>'Sri Lanka','label_category'=>3,'active'=>'1','create_user'=>'admin','create_at'=>'2025-01-10']);
DB::table('rms_label_master')->insert(['label_id'=>901,'label_name'=>'Remote','label_category'=>3,'active'=>'1','create_user'=>'admin','create_at'=>'2025-01-10']);
foreach ([1=>'Retail',2=>'Security',3=>'Healthcare',4=>'Drivers',5=>'Professional'] as $id=>$n) DB::table('rms_job_domain_master')->insert(['domain_id'=>$id,'domain_name'=>$n]);
$domainFor = [72=>1,75=>2,60=>3,79=>4,80=>5];
// ---- companies
$companyCreated = [101=>'2025-03-14',102=>'2025-05-02',103=>'2025-07-21',104=>'2025-09-09',105=>'2026-02-17',106=>'2026-06-05',107=>'2026-11-24'];
foreach ($d['companies'] as $c) DB::table('rms_company_master')->insert(['company_id'=>$c['company_id'],'company_name'=>$c['company_name'],'company_logo'=>$c['company_logo'],'company_overview'=>$c['company_overview'],'create_user'=>'admin','modify_user'=>'admin','create_ts'=>$companyCreated[$c['company_id']].' 10:15:00','modify_ts'=>$companyCreated[$c['company_id']].' 10:15:00']);
// ---- users
$U = function($id,$cid,$f,$l,$type,$email) { DB::table('rms_user_master')->insert(['user_id'=>$id,'company_id'=>$cid,'name'=>"$f $l",'user_name'=>strtolower("$f.$l"),'password'=>Hash::make('prototype'),'user_type'=>$type,'user_title'=>'Ms','user_fname'=>$f,'user_lname'=>$l,'user_compname'=>$cid? DB::table('rms_company_master')->where('company_id',$cid)->value('company_name'):'Job Labs','email'=>$email,'user_email_verified_at'=>$email,'user_mobile'=>'94-07'.mt_rand(10000000,99999999),'create_user'=>'admin','modify_user'=>'admin','create_ts'=>'2025-06-01 09:00:00','modify_ts'=>'2025-06-01 09:00:00','account_status'=>'active','subscription_status'=>'active']); };
$U(1,null,'Piyumi','Perera','Super Admin','admin@job-labs.lk');
$U(2,null,'Nimesha','Fernando','Account Manager','accounts@job-labs.lk');
$U(3,104,'Dilan','Jayasuriya','Hiring Manager','dilan@nuwaradigital.lk');
$U(4,104,'Ishara','Silva','Hiring Manager','ishara@nuwaradigital.lk');
$hmNames=[101=>['Kasun','Bandara','kasun@gallecoast.lk'],102=>['Tharushi','Wijeratne','hr@ruhunamedicare.lk'],103=>['Ruwan','Dissanayake','ruwan@sigirisecure.lk'],105=>['Amaya','Gunasekara','amaya@lankaswift.lk'],106=>['Chamath','Rajapaksha','careers@mahaweli.lk'],107=>['Sachini','Herath','people@kelanihotels.lk']];
$uid=5; $hmEmail=[104=>['Dilan Jayasuriya','dilan@nuwaradigital.lk']];
foreach ($hmNames as $cid=>[$f,$l,$e]) { $U($uid++,$cid,$f,$l,'Hiring Manager',$e); $hmEmail[$cid]=["$f $l",$e]; }
DB::table('rms_user_company')->insert(['user_id'=>3,'company_id'=>101,'created_at'=>$now,'updated_at'=>$now]); // Dilan also manages Galle Coast Retail
// ---- roles & permissions
foreach (['role-list','role-create','role-edit','role-delete','Job-Create','Job-Edit','Job-Delete','Job-Track','Company-Create','Company-Edit','Company-Delete','Label-Create','Label-Edit','Label-Delete','Category-Create','Category-Edit','Category-Delete'] as $p) Spatie\Permission\Models\Permission::create(['name'=>$p]);
$sa = Spatie\Permission\Models\Role::create(['name'=>'superadmin']); $sa->syncPermissions(Spatie\Permission\Models\Permission::all());
$am = Spatie\Permission\Models\Role::create(['name'=>'Account Manager']); $am->syncPermissions(Spatie\Permission\Models\Permission::where('name','not like','role-%')->get());
$hm = Spatie\Permission\Models\Role::create(['name'=>'Hiring-Manager']); $hm->syncPermissions(['Job-Create','Job-Edit','Job-Track']);
App\User::find(1)->assignRole('superadmin'); App\User::find(2)->assignRole('Account Manager');
foreach (DB::table('rms_user_master')->where('user_id','>=',3)->pluck('user_id') as $id) App\User::find($id)->assignRole('Hiring-Manager');
// ---- jobs (the 24 prototype vacancies, live)
$jobRows=[];
foreach ($d['jobs'] as $j) {
  $live = Carbon::parse($j['job_adv_livedate']);
  [$cn,$ce] = $hmEmail[$j['company_id']];
  $row = ['job_id'=>$j['job_id'],'company_id'=>$j['company_id'],'job_refno'=>$j['job_refno'],'job_title'=>$j['job_title'],'job_location'=>$j['city_id']==21?901:900,'job_industrysector'=>$j['job_industrysector'],'job_adv_jobtype'=>$j['job_adv_jobtype'],'job_adv_jobsector'=>$j['job_adv_jobsector'],'job_adv_worktype'=>$j['job_adv_worktype'],'job_adv_description'=>$j['job_adv_description'],'job_adv_salary'=>$j['job_adv_salary'],'job_payroll'=>'permonth','job_adv_livedate'=>$j['job_adv_livedate'],'job_adv_closingdate'=>$j['job_adv_closingdate'],'job_adv_startdate'=>$j['job_adv_startdate'],'job_adv_total_vacancies'=>$j['job_adv_total_vacancies'],'job_adv_status'=>'1','job_adv_contact_name'=>$cn,'job_adv_contact_position'=>'HR Manager','job_adv_contact_email'=>$ce,'job_adv_contact_mobile'=>'0771234567','job_adv_contact_landline'=>'0112345678','job_adv_top_rated'=>(string)$j['job_adv_top_rated'],'job_adv_urgent'=>(string)($j['job_adv_urgent']??'0'),'job_adv_views'=>$j['job_adv_views'],'job_adv_fake_views_enabled'=>0,'job_adv_domain_name'=>$domainFor[$j['job_industrysector']]??5,'job_adv_keyword'=>$j['job_adv_keyword'],'job_benifits'=>$j['job_benifits'],'create_user'=>'hm','create_at'=>$live->copy()->subDay()->setTime(14,mt_rand(0,59)),'job_adv_active'=>1,'job_adv_archived'=>0,'city_id'=>$j['city_id'],'modify_user'=>'admin','modify_at'=>$live->copy()->setTime(10,mt_rand(0,59)),'job_adv_published_at'=>$live->copy()->setTime(9,mt_rand(5,55))];
  DB::table('rms_job_adv_template')->insert($row); $jobRows[$j['job_id']]=$row;
}
$tmpl = array_values($jobRows);
// extra jobs: on hold (new submissions), rejected, closed history across the year, archived
$nextId = 2000; $extra=[];
$mk = function($base,$status,$active,$created,$closing,$archived=0,$title=null) use (&$nextId) {
  $id=$nextId++; $r=$base; $r['job_id']=$id; $r['job_refno']=sprintf('JBS%06d',$id-1700); if($title) $r['job_title']=$title; $r['job_adv_status']=$status; $r['job_adv_active']=$active; $r['job_adv_archived']=$archived;
  $r['create_at']=$created; $r['job_adv_livedate']=Carbon::parse($created)->addDay()->toDateString(); $r['job_adv_closingdate']=$closing; $r['job_adv_top_rated']='0'; $r['job_adv_urgent']='0';
  $r['job_adv_published_at']= in_array($status,['1','4']) ? Carbon::parse($created)->addDay()->setTime(9,30) : null; $r['job_adv_views']=mt_rand(80,900);
  DB::table('rms_job_adv_template')->insert($r); return $r; };
$onHold = [[$jobRows[1008],'Junior Laravel Developer',104,0],[$jobRows[1000],'Store Supervisor',101,1],[$jobRows[1003],'Ward Assistant',102,2],[$jobRows[1006],'Night Shift Security Supervisor',103,0]];
foreach ($onHold as [$b,$t,$cid,$ago]) { $b['company_id']=$cid; $mk($b,'0',0,$today->copy()->subDays($ago)->setTime(11,mt_rand(0,59)),$today->copy()->addDays(30)->toDateString(),0,$t); }
$b=$jobRows[1005]; $mk($b,'3',0,$today->copy()->subDays(9)->setTime(15,10),$today->copy()->addDays(20)->toDateString(),0,'Pharmacy Assistant (duplicate post)');
$histTitles=['Sales Executive','Customer Service Agent','Delivery Rider','Accounts Assistant','Staff Nurse','Security Guard','Software Engineer','Receptionist','Marketing Executive','Branch Officer','Data Entry Operator','Store Keeper','Chef de Partie','Front Office Executive','HR Assistant'];
for ($m=1;$m<=10;$m++) { $n = 2 + intdiv($m,2); for($k=0;$k<$n;$k++){ $b=$pick($tmpl); $created=Carbon::create(2026,$m,mt_rand(1,25),mt_rand(9,17),mt_rand(0,59)); $r=$mk($b,'4',0,$created,$created->copy()->addDays(28)->toDateString(),($m<4 && $k==0)?1:0,$pick($histTitles)); $extra[]=$r; } }
// ---- candidates + applications
$first=['Nethmi','Kavindu','Sachini','Tharindu','Dulani','Pasindu','Hiruni','Chamod','Ishani','Ravindu','Malsha','Supun','Nadeesha','Lahiru','Shehani','Dinuka','Bimsara','Hasini','Janith','Oshadi','Yasiru','Anjali','Thilini','Sandun','Ruvini','Chathura','Kaveesha','Udara','Sanduni','Dilshan','Methmi','Akila','Chalaka','Saliha','Bewani','Nethra','Fathima','Arjun','Priya','Mohamed'];
$last=['Perera','Fernando','Silva','Jayawardena','Bandara','Wickramasinghe','Rathnayake','Herath','Gunawardena','Dissanayake','Kumara','Senanayake','Abeysekara','Jayasinghe','Weerasinghe','Rajapaksha','Ekanayake','Sharaz','Thittagalla','Rizvi'];
$locs=['Colombo','Kandy','Galle','Gampaha','Negombo','Kurunegala','Matara','Kesbewa','Panadura','Trincomalee','Jaffna','Ratnapura'];
$cands=[]; $cid=1;
$allJobs = DB::table('rms_job_adv_template')->whereIn('job_adv_status',['1','4'])->get();
$appId=1;
foreach ($allJobs as $job) {
  $isLive = $job->job_adv_status==='1';
  $n = $isLive ? mt_rand(4, 22) : mt_rand(6, 30);
  $start = Carbon::parse($job->job_adv_livedate); $endD = $isLive ? $today->copy() : Carbon::parse($job->job_adv_closingdate);
  if ($endD->lt($start)) $endD=$start->copy();
  for ($i=0;$i<$n;$i++) {
    $when = $start->copy()->addSeconds(mt_rand(0, max(1,$endD->diffInSeconds($start)+86000)));
    if ($when->gt($now)) $when=$now->copy()->subMinutes(mt_rand(5,600));
    if (mt_rand(1,100)<=25 && count($cands)>5) { $c=$cands[array_rand($cands)]; }
    else { $f=$pick($first); $l=$pick($last); $c=['candidate_id'=>$cid++,'candidate_title'=>$pick(['Mr','Ms','Mrs']),'candidate_fname'=>$f,'candidate_lname'=>$l,'candidate_email'=>strtolower($f.$l.mt_rand(1,999)).'@gmail.com','candidate_location'=>$pick($locs),'candidate_rights_to_work'=>'Not Applicable','candidate_limitations'=>'Not Applicable','candidate_eligible'=>'Not Applicable','candidate_customer_service_experience'=>'Not Applicable','candidate_cash_handling_experience'=>'Not Applicable','candidate_face_to_face_selling'=>'Not Applicable','candidate_mobile'=>'94-07'.mt_rand(10000000,99999999),'candidate_covingletter'=>'I am very interested in this role and believe my experience makes me a strong fit.','candidate_cv'=>'cvs/sample-cv.pdf','cand_register_date'=>$when->toDateTimeString()]; DB::table('rms_candidate_masters')->insert($c); $cands[]=$c; }
    $r=mt_rand(1,100); $seen = $r>45 ? '1':'0'; $iv = $r>88 ? '1':'0'; $hold = ($r>80 && $r<=84)?'1':'0'; $rej = ($r>70 && $r<=80) ? 'Hiring Manager':null;
    DB::table('rms_application_tracking_masters')->insert(['application_track_id'=>$appId++,'candidate_id'=>$c['candidate_id'],'job_id'=>$job->job_id,'hm_cv_seen'=>$seen,'rejectedby'=>$rej,'progressed_to_interview'=>$iv,'rejected_after_interview'=>'0','onhold'=>$hold,'comments'=>$iv=='1'?'Shortlisted for first interview':null,'cand_info_addes_to_center_db'=>'0','application_date'=>$when->toDateString(),'application_submitted_at'=>$when->toDateTimeString(),'candidate_cv'=>'cvs/sample-cv.pdf','created_at'=>$when,'updated_at'=>$when]);
  }
}
// a couple of NULL-flag rows (like old data) to show the pipeline fix
DB::table('rms_application_tracking_masters')->where('application_track_id','<=',2)->update(['rejected_after_interview'=>null]);
// ---- vacancy views (unique views) last 60 days
$live = DB::table('rms_job_adv_template')->where('job_adv_status','1')->pluck('job_id')->all(); $vrows=[];
for($i=0;$i<2600;$i++){ $t=$now->copy()->subMinutes(mt_rand(0,60*24*60)); $vrows[]=['job_id'=>$pick($live),'session_id'=>md5($i),'ip_address'=>'10.0.'.mt_rand(0,255).'.'.mt_rand(1,254),'viewed_at'=>$t]; if(count($vrows)>=500){DB::table('job_vacancy_views')->insert($vrows);$vrows=[];} }
if($vrows) DB::table('job_vacancy_views')->insert($vrows);
// ---- leads
$leadData=[['Mr','Kamal','Perera','HR','Ceylon Spice Exports','inbox','new'],['Ms','Dinithi','Abeysekara','HR Manager','Blue Ocean Resorts','inbox','new'],['Mr','Rohan','Mendis','Director','Mendis Constructions','contact_made','contacted'],['Ms','Shanika','Peiris','Talent Acquisition Lead','Peiris Pharma','contact_made','contacted'],['Mr','Asanka','Liyanage','CEO','Liyanage Motors','proposal_sent','interested'],['Ms','Hansi','Wijesinghe','HR Executive','Wijesinghe Textiles','proposal_sent','interested'],['Mr','Nuwan','Karunaratne','Operations Manager','Island Fresh Foods','inbox','new'],['Ms','Gayani','Samarasinghe','People Partner','Samara Tech','converted','converted'],['Mr','Isuru','Wanigasekara','Managing Director','Wani Engineering','inbox','new'],['Ms','Rashmi','De Silva','HR','De Silva Holdings','contact_made','contacted']];
foreach($leadData as $i=>[$t,$f,$l,$p,$co,$stage,$st]) { $c=$now->copy()->subDays(mt_rand(0,40))->subHours(mt_rand(0,20)); DB::table('leads')->insert(['title'=>$t,'first_name'=>$f,'last_name'=>$l,'position'=>$p,'company_name'=>$co,'email'=>strtolower($f).'@'.strtolower(str_replace(' ','',$co)).'.lk','phone'=>'+94 77'.mt_rand(1000000,9999999),'office_number'=>'011'.mt_rand(2000000,2999999),'requested_at'=>$c->copy()->addDays(2)->setTime(10,0),'sector'=>$pick(['Retail','Health Care','Professional','Security']),'options'=>$pick(['Urgent Vacancy Advertisement','Featured Vacancy Advertisement','Recruitment Video Advert','Urgent Vacancy Advertisement, Job Ending Tag']),'logo_path'=>null,'status'=>$st,'stage'=>$stage,'notes'=>null,'email_opt_in'=>1,'verification_status'=>'verified','verification_method'=>'email','verified_at'=>$c,'created_at'=>$c,'updated_at'=>$c]); }
// ---- audit logs
$types=['job_new_admin','job_new_hr_manager','job_status_admin','job_status_hr_manager','application_admin_notify','application_candidate_confirm','application_hm_notify','job_close_confirmation','user_request_admin','contact_form_admin_notify','job_close_reminder'];
$jobsAll = DB::table('rms_job_adv_template')->get()->all();
for($i=0;$i<140;$i++){ $j=$pick($jobsAll); $t=$pick($types); $at=$now->copy()->subMinutes(mt_rand(10,60*24*45)); $failed = mt_rand(1,100)<=5;
  DB::table('audit_email_logs')->insert(['email_type'=>$t,'triggered_by_user_id'=>str_contains($t,'application')||$t=='job_close_reminder'||$t=='job_close_confirmation'?null:$pick([1,2,3]),'triggered_by_name'=>str_contains($t,'application')||str_contains($t,'close')?'System':$pick(['Piyumi Perera','Nimesha Fernando','Dilan Jayasuriya']),'recipient_email'=>str_contains($t,'admin')?'recruitment@job-labs.lk, resourcing@job-labs.lk':$j->job_adv_contact_email,'recipient_name'=>str_contains($t,'admin')?'Admin Team':$j->job_adv_contact_name,'subject'=>App\Models\AuditEmailLog::typeLabel($t),'job_id'=>$j->job_id,'job_refno'=>$j->job_refno,'job_title'=>$j->job_title,'company_id'=>$j->company_id,'company_name'=>DB::table('rms_company_master')->where('company_id',$j->company_id)->value('company_name'),'status'=>$failed?'failed':'sent','error_message'=>$failed?'Connection could not be established with host smtp-relay.brevo.com':null,'sent_at'=>$at,'created_at'=>$at,'updated_at'=>$at]); }
$acts=[['created','0','0','Vacancy posted by hiring manager.'],['status_changed','0','1','Status changed by admin via Admin Actions panel.'],['updated','1','0','Vacancy details updated. Status reset to On Hold pending re-approval.'],['status_changed','1','4','Vacancy closed automatically - closing date reached.'],['archived','4','4','Vacancy archived and removed from active listings.']];
for($i=0;$i<90;$i++){ $j=$pick($jobsAll); [$a,$o,$n,$note]=$pick($acts); $at=$now->copy()->subMinutes(mt_rand(10,60*24*60)); $who=$pick([[1,'Piyumi Perera','superadmin'],[2,'Nimesha Fernando','Account Manager'],[3,'Dilan Jayasuriya','Hiring-Manager'],[null,'System',null]]);
  DB::table('audit_vacancy_logs')->insert(['action'=>$a,'job_id'=>$j->job_id,'job_refno'=>$j->job_refno,'job_title'=>$j->job_title,'company_id'=>$j->company_id,'company_name'=>DB::table('rms_company_master')->where('company_id',$j->company_id)->value('company_name'),'performed_by_user_id'=>$who[0],'performed_by_name'=>$who[1],'performed_by_role'=>$who[2],'old_status'=>$o,'new_status'=>$n,'old_active'=>$o==='1'?1:0,'new_active'=>$n==='1'?1:0,'is_archived'=>$a==='archived'?1:0,'notes'=>$note,'performed_at'=>$at,'created_at'=>$at,'updated_at'=>$at]); }
// ---- activity log
$subs=['login','Job List','Job update','Job Edit','Company List','User List','Job Restored','Candidate Report'];
for($i=0;$i<80;$i++){ $at=$now->copy()->subMinutes(mt_rand(5,60*24*20)); DB::table('log_activities')->insert(['subject'=>$pick($subs),'url'=>'https://www.job-labs.lk/admin/job/list','method'=>'GET','ip'=>'112.134.'.mt_rand(0,255).'.'.mt_rand(1,254),'agent'=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0','user_id'=>$pick([1,2,3,4,5]),'created_at'=>$at,'updated_at'=>$at]); }
// ---- support tickets
$tk=[[3,104,'Need to extend closing date for QA Engineer','Hi team, could you extend the QA Engineer vacancy by one more week? We are still interviewing.','in_progress'],[5,101,'Cannot download applicant CVs','When I click Download on some applicants nothing happens.','unread'],[6,102,'Invoice request','Please send the invoice for last month\'s featured adverts.','closed'],[3,104,'Add a new user for our team','Please add ishara@nuwaradigital.lk as a user for our account.','read']];
foreach($tk as $i=>[$u,$c,$s,$m,$st]){ $at=$now->copy()->subDays($i*3+1); DB::table('support_tickets')->insert(['ticket_id'=>$i+1,'user_id'=>$u,'company_id'=>$c,'subject'=>$s,'message'=>$m,'status'=>$st,'is_archived'=>0,'closed_at'=>$st==='closed'?$at->copy()->addDay():null,'created_at'=>$at,'updated_at'=>$at]); if($st!=='unread') DB::table('support_ticket_replies')->insert(['ticket_id'=>$i+1,'user_id'=>2,'reply_message'=>'Thanks for reaching out - we are looking into this now.','is_staff'=>1,'created_at'=>$at->copy()->addHours(3),'updated_at'=>$at->copy()->addHours(3)]); }
// ---- interviews
for($i=0;$i<6;$i++){ $a=DB::table('rms_application_tracking_masters')->where('progressed_to_interview','1')->skip($i)->first(); if(!$a) break; $st=$now->copy()->addDays(mt_rand(1,10))->setTime(mt_rand(9,16),0); DB::table('interview_schedules')->insert(['candidate_id'=>$a->candidate_id,'job_id'=>$a->job_id,'platform'=>'zoom','meeting_link'=>'https://zoom.us/j/0000000000','host_link'=>null,'start_time'=>$st,'end_time'=>$st->copy()->addMinutes(45),'status'=>'scheduled','notes'=>'First round interview','created_at'=>$now,'updated_at'=>$now]); }
echo "jobs=".DB::table('rms_job_adv_template')->count()." cands=".DB::table('rms_candidate_masters')->count()." apps=".DB::table('rms_application_tracking_masters')->count()." views=".DB::table('job_vacancy_views')->count()."\n";
