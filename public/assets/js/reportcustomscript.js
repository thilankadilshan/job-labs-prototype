$(function () {
// var jq = $.noConflict(); 
  var CSRF_TOKEN = $('meta[name="csrf-token"]').attr('content');

  var joblistByDateTable =  $('#joblistbydate').DataTable({
    dom: 'Bfrtip',
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    "aLengthMenu": [
      [5, 10, 15, -1],
      [5, 10, 15, "All"]
    ],
    "iDisplayLength": 10,
    "language": {
      search: ""
    }
   
  });

  var candidatelistbydate = $('#candidatelistbydate').DataTable({
    dom: 'Bfrtip',
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    "aLengthMenu": [
      [5, 10, 15, -1],
      [5, 10, 15, "All"]
    ],
    "iDisplayLength": 10,
    "language": {
      search: ""
    }
   
  });

var applicantlistbydate = $('#applicantlistbydate').DataTable({
  dom: 'Bfrtip',
  buttons: [
      'copy', 'csv', 'excel', 'pdf', 'print'
  ],
  "aLengthMenu": [
    [5, 10, 15, -1],
    [5, 10, 15, "All"]
  ],
  "iDisplayLength": 10,
  "language": {
    search: ""
  }
 
});

  
  $("#getjobreport").click(function(){ 
        var formDate  = $("#formDate").val();
        var toDate    = $("#toDate").val();
        var companyId = $("#companyId").val();
        var jobState  = $("#jobState:checked").val();
        
         if(jobState == "PUBLISHED") {
          $('#joblistbydate tr').eq(0).find('th').eq(9).html('Job Created On');
          $('#clientlistbydatefooter').html('Job Created On');
        } else if(jobState  == "CLOSED") {
          $('#joblistbydate tr').eq(0).find('th').eq(9).html('Job Closed On');
          $('#clientlistbydatefooter').html('Job Closed On');
        } else if(jobState  == "ARCHIVED") { 
          $('#joblistbydate tr').eq(0).find('th').eq(9).html('Job Archieved On');
          $('#clientlistbydatefooter').html('Job Archieved On');
        } else if(jobState  == "APPROVED") { 
          $('#joblistbydate tr').eq(0).find('th').eq(9).html('Job Published On');
          $('#clientlistbydatefooter').html('Job Published On');
        }else if(jobState  == "HOLD") { 
          $('#joblistbydate tr').eq(0).find('th').eq(9).html('Job Held On');
          $('#clientlistbydatefooter').html('Job Held On');
        }
        
        if (formDate !== "" && toDate !== undefined  && companyId !== ""
            && companyId  !== undefined   && jobState !== ""
            && jobState  !==undefined )  {
          //$('#companyempList tbody').clear();
          $('#joblistbydate').dataTable().fnClearTable();
          // Fetch data
          $.ajax({
                  url:"/admin/report/vacancy/list/bydate",
                  type: 'post',
                  dataType: "json",
                  data: {
                      _token: CSRF_TOKEN,
                      formDate: formDate,
                      toDate : toDate,
                      companyId : companyId,
                      jobState : jobState
                  },
                  success: function( jobDataList ) {
                    $('#joblistbydate').dataTable().fnClearTable();
                          for(var i=0;i<jobDataList.length;i++) {
                            var jobStatus;
                            var payroll;
                            if(jobDataList[i]["job_adv_status"] == 1) {
                              jobStatus = "Approved";
                              }else if(jobDataList[i]["job_adv_status"] == 0) {
                                jobStatus = "On Hold";
                              }else if(jobDataList[i]["job_adv_status"] == 2) {
                                jobStatus = "On Progress"
                              }else if(jobDataList[i]["job_adv_status"] == 3) {
                                jobStatus = "Reject";
                              }else if(jobDataList[i]["job_adv_status"] == 4) {
                                jobStatus = "Closed";
                            }
                            if (jobDataList[i]["job_payroll"] == 'perannum' ) { 
                              payroll = " / Annum "; 
                              } else if (jobDataList[i]["job_payroll"] == 'permonth' ){
                                payroll = " / Month";
                              }else if (jobDataList[i]["job_payroll"] == 'perday' ){
                                payroll = " / Day "; 
                              }else if (jobDataList[i]["job_payroll"] == 'perhour' ){
                                payroll = " / Hour";
                             }
                             
                             var closingDate  = new Date(jobDataList[i]["job_adv_closingdate"]);
                             var jobCloseDate = closingDate.toLocaleDateString("en-GB")

                             var liveDate  = new Date(jobDataList[i]["job_adv_livedate"]);
                             var jobLiveDate = liveDate.toLocaleDateString("en-GB")

                             var createDate  = new Date(jobDataList[i]["create_at"]);
                             var jobCreateDate = createDate.toLocaleDateString("en-GB")

                             var modifyDate  = new Date(jobDataList[i]["modify_at"]);
                             var jobModifyDate = modifyDate.toLocaleDateString("en-GB")

                              var createDate  = new Date(jobDataList[i]["create_at"]);
                             var date = createDate.getDate()+'/'+(createDate.getMonth()+1)+'/'+createDate.getFullYear();
                             var time = createDate.getHours() + ":" + createDate.getMinutes() + ":" + createDate.getSeconds()
                             var CreateDatetime = date+' '+time;

                             var modifyDate  = new Date(jobDataList[i]["modify_at"]);
                            var date = modifyDate.getDate()+'/'+(modifyDate.getMonth()+1)+'/'+modifyDate.getFullYear();
                            var time = modifyDate.getHours() + ":" + modifyDate.getMinutes() + ":" + modifyDate.getSeconds()
                            var ModifyDatetime = date+' '+time;
                             
                             var actualdate;

                            if(jobState == "PUBLISHED"){
                              actualdate = jobCreateDate;
                            }else if(jobState == "CLOSED"){
                              actualdate = jobModifyDate;
                            }else if(jobState == "ARCHIVED"){
                              actualdate = jobModifyDate;
                            }else if(jobState == "APPROVED"){
                              actualdate = jobModifyDate;
                            }else if(jobState == "HOLD"){
                              actualdate = jobModifyDate;
                            }

                            joblistByDateTable.row.add([jobDataList[i]["job_refno"], 
                            jobDataList[i]["job_title"], jobDataList[i]["location"], 
                            jobDataList[i]["industrysector"], jobDataList[i]["jobtype"], 
                            jobDataList[i]["worktype"], '£'+ jobDataList[i]["job_adv_salary"] + payroll,
                            jobLiveDate, jobCloseDate,actualdate,
                            jobDataList[i]["job_adv_total_vacancies"], jobDataList[i]["jobcount"],jobStatus,CreateDatetime,ModifyDatetime])
                            joblistByDateTable.draw();
                          }
                  },
                  failure: function () {
                    $("#joblistbydate").append(" Error when fetching data please contact administrator");
              }
              });
        } else {
            alert("Please select all options")
        }
      });

      $("#getcandidatereport").click(function(){ 
        var formDate  = $("#formDate").val();
        var toDate    = $("#toDate").val();
        var cndRepState  = $("#cndreptype:checked").val();
        
        if(cndRepState == "EMAIL_ADDRESS") {
          $('#candidatelistbydate tr').eq(0).find('th').eq(1).html('Email Address');
          $('#candidatelistbydatefooter').html('Email Address');
        } else if(cndRepState  == "MOBILE_NUMBER") {
          $('#candidatelistbydate tr').eq(0).find('th').eq(1).html('Mobile Number');
          $('#candidatelistbydatefooter').html('Mobile Number');
        } else if(cndRepState  == "UK_NO_RES") { 
          $('#candidatelistbydate tr').eq(0).find('th').eq(1).html('Right To Work');
          $('#candidatelistbydatefooter').html('Right To Work');
        } else if(cndRepState  == "STUDENT_VISA") { 
          $('#candidatelistbydate tr').eq(0).find('th').eq(1).html('Student Visa');
          $('#candidatelistbydatefooter').html('Student Visa');
        }
        if (formDate !== "" && toDate !== undefined && cndRepState !== ""
            && cndRepState  !== undefined )  {
          //$('#companyempList tbody').clear();
          $('#candidatelistbydate').dataTable().fnClearTable();
          // Fetch data
            $.ajax({
                  url:"/admin/report/candidate/list",
                  type: 'post',
                  dataType: "json",
                  data: {
                      _token: CSRF_TOKEN,
                      formDate: formDate,
                      toDate : toDate,
                      cndRepState : cndRepState
                  },
                  success: function( candidateDataList ) {
                    console.log(candidateDataList)
                      $('#candidatelistbydate').dataTable().fnClearTable();
                          for(var i=0;i<candidateDataList.length;i++) {
                            candidatelistbydate.row.add([candidateDataList[i]["candidate_title"]+" "+candidateDataList[i]["candidateFirstName"] + " "+ 
                            candidateDataList[i]["candidateLastName"], candidateDataList[i]["candidateCustomValue"],candidateDataList[i]["job_title"], candidateDataList[i]["job_refno"],candidateDataList[i]["company_name"] ])
                            candidatelistbydate.draw();
                          }
                  },
                  
                  failure: function () {
                      $("#candidatelistbydate").append(" Error when fetching data please contact administrator");
                  }
              });
        } else {
            alert("Please select all options")
        }
      }); 

      $("#company_search").change(function(){ 
        var companyId = $("#companyId").val();
        alert("hi 11");
        if(companyId > 0 ) {
              $.ajax({
                url:"/admin/report/applicant/company/job/list",
                type: 'post',
                dataType: "json",
                data: {
                    _token: CSRF_TOKEN,
                    companyId : companyId
                },
                success: function(jobDataList) {
                  $('#companyJob').empty();
                  $('#companyJob').append($("<option></option>")
                  .attr("value", "")
                  .text("-- Select --")
                  ); 
                  for(var i=0;i<jobDataList.length;i++) {
                    $('#companyJob').append($("<option></option>")
                                   .attr("value", jobDataList[i].job_id)
                                   .text(jobDataList[i]["job_refno"]+"-"+jobDataList[i]["job_title"])
                                   ); 
                 }
                },
                failure: function () {
                    $("#candidatelistbydate").append(" Error when fetching data please contact administrator");
                }
            });
      } else {
        alert("Please select company");
      }
   });


   $("#getjobappliedreport").click(function(){ 
  
    var formDate  = $("#formDate").val();
    var toDate    = $("#toDate").val();
    var appRepState  = $("#applisted:checked").val();
    var jobId = $("#companyJob").val();
  
    if (formDate !== "" && toDate !== undefined && jobId !== ""
        && jobId  !== undefined )  {
      //$('#companyempList tbody').clear();
      $('#applicantlistbydate').dataTable().fnClearTable();
      // Fetch data
        $.ajax({
              url:"/admin/report/applicant/list",
              type: 'post',
              dataType: "json",
              data: {
                  _token: CSRF_TOKEN,
                  formDate: formDate,
                  toDate : toDate,
                  appRepState : appRepState,
                  jobId : jobId
              },
              success: function( applicantDataList ) {
                  $('#applicantlistbydate').dataTable().fnClearTable();
                      for(var i=0;i<applicantDataList.length;i++) {

                        var applicantStatus;
                        var applicantcvseen;
                        var applicantrejseen;
                            if(applicantDataList[i]["progressed_to_interview"] == 1) {
                              applicantStatus = "Yes"
                            }else if(applicantDataList[i]["progressed_to_interview"] == 0) {
                              applicantStatus = "No"
                            }else {
                              applicantStatus = "No Update"
                            }

                              if(applicantDataList[i]["hm_cv_seen"] == 1) {
                              applicantcvseen = "Yes"
                            }else if(applicantDataList[i]["hm_cv_seen"] == 0) {
                              applicantcvseen = "No"
                            }else {
                              applicantcvseen = "No Update"
                            }
                            
                            if(applicantDataList[i]["rejected_after_interview"] == 1) {
                              applicantrejseen = "Yes"
                            }else if(applicantDataList[i]["rejected_after_interview"] == 0) {
                              applicantrejseen = "No"
                            }else  {
                              applicantrejseen = "No Update"
                            }
/* 
                            if(applicantDataList[i]["onhold"] == 1) {
                              applicantStatus = "Onhold"
                            }else if(applicantDataList[i]["onhold"] == 0) {
                              applicantStatus = "Not Hold"
                            }else if(applicantDataList[i]["hm_cv_seen"] == 'Null') {
                              applicantStatus = "No Status Avilable"
                            }*/
                            
                            

                        applicantlistbydate.row.add([applicantDataList[i]["candidate_title"]+" "+applicantDataList[i]["candidate_fname"]+" "+applicantDataList[i]["candidate_lname"], applicantDataList[i]["candidate_email"],
                        applicantDataList[i]["candidate_mobile"], applicantDataList[i]["candidate_landline"],
                        applicantDataList[i]["candidate_rights_to_work"], applicantDataList[i]["candidate_location"], applicantStatus, applicantcvseen, applicantrejseen
                      ])
                        applicantlistbydate.draw();
                      }
              },
              failure: function () {
                  $("#applicantlistbydate").append(" Error when fetching data please contact administrator");
              }
          });
    } else {
        alert("Please select all options")
    }
  }); 

      

});