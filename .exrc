set foldmethod=expr
set foldexpr=getline(v:lnum)=~'^/\\*\ .*\\*\\/$'?'>1':'='
