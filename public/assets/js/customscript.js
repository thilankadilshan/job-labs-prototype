$(function () {
var CSRF_TOKEN = $('meta[name="csrf-token"]').attr('content');
   //var jq = $.noConflict(); 
  
   $("#industrysector").autocomplete({
              source: function( request, response ) {
              // Fetch data
              $.ajax({
                url:"industry/list",
                type: 'post',
                dataType: "json",
                data: {
                  _token: CSRF_TOKEN,
                  search: request.term
                },
                success: function( data ) {
                  console.log(data)
                  response( data );
                 
                }
              });
            },
            select: function (event, ui) {
              $('#industrysector').val(ui.item.label); // display the selected text
              $('#industrysectorid').val(ui.item.value); // save selected id to input
              selectJobsector(ui.item.value);
              return false;
            }
        });

        function selectJobsector(industryId) {
          $.ajax({
                url:"jobsector/list",
                type: 'post',
                dataType: "json",
                data: {
                  _token: CSRF_TOKEN,
                  label_parentId: industryId
                },
                success: function( data ) {
                  console.log(data.length)
                 for(var i=0;i<data.length;i++) {
                    console.log(data[i].value);
                    var added = document.createElement('option');
                    var select1 = $('#jobsector');
                    added.value = data[i].value;
                    added.innerHTML = data[i].label;
                    select1.append(added);
                  }
                  
                 
                }
              });

        }

        $("#location").autocomplete({
              source: function( request, response ) {
              // Fetch data
              $.ajax({
                url:"location/list",
                type: 'post',
                dataType: "json",
                data: {
                  _token: CSRF_TOKEN,
                  search: request.term
                },
                success: function( data ) {
                  console.log(data)
                  response( data );
                 
                }
              });
            },
            select: function (event, ui) {
              $('#location').val(ui.item.label); // display the selected text
              $('#locationid').val(ui.item.value); // save selected id to input
              return false;
            }
        });
        
        $("#company_search" ).autocomplete({
              source: function( request, response ) {
              
              // Fetch data
              $.ajax({
                url:'company/list',
                type: 'post',
                dataType: "json",
                data: {
                _token: CSRF_TOKEN,
                search: request.term
                },
                success: function( data ) {
                  response( data );
                }
              });
            },
            select: function (event, ui) {
              // Set selection
              $('#company_search').val(ui.item.label); // display the selected text
              $('#companyId').val(ui.item.value); // save selected id to input
              return false;
            }
        });
    });