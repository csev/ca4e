// i4004 emulator - gui functions
// Maciej Szyc 2006, e4004.szyc.org

// Disassemble functions

var hextab= ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];

var opctab= [
	'NOP',   '???',   '???',   '???',   '???',   '???',   '???',   '???',    // 00
	'???',   '???',   '???',   '???',   '???',   '???',   '???',   '???',    // 08
	'???',   'JCN TZ','JCN CZ','???',   'JCN AZ','???',   '???',   '???',    // 10
	'???',   'JCN TN','JCN CN','???',   'JCN AN','???',   '???',   '???',    // 18
	'FIM P0','SRC P0','FIM P1','SRC P1','FIM P2','SRC P2','FIM P3','SRC P3', // 20
	'FIM P4','SRC P4','FIM P5','SRC P5','FIM P6','SRC P6','FIM P7','SRC P7', // 28
	'FIN P0','JIN P0','FIN P1','JIN P1','FIN P2','JIN P2','FIN P3','JIN P3', // 30
	'FIN P4','JIN P4','FIN P5','JIN P5','FIN P6','JIN P6','FIN P7','JIN P7', // 38
	'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',    // 40
	'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',   'JUN',    // 48
	'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',    // 50
	'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',   'JMS',    // 58
	'INC R0','INC R1','INC R2','INC R3','INC R4','INC R5','INC R6','INC R7', // 60
	'INC R8','INC R9','INC R10','INC R11','INC R12','INC R13','INC R14','INC R15',
	'ISZ R0','ISZ R1','ISZ R2','ISZ R3','ISZ R4','ISZ R5','ISZ R6','ISZ R7', // 70
	'ISZ R8','ISZ R9','ISZ R10','ISZ R11','ISZ R12','ISZ R13','ISZ R14','ISZ R15',
	'ADD R0','ADD R1','ADD R2','ADD R3','ADD R4','ADD R5','ADD R6','ADD R7', // 80
	'ADD R8','ADD R9','ADD R10','ADD R11','ADD R12','ADD R13','ADD R14','ADD R15',
	'SUB R0','SUB R1','SUB R2','SUB R3','SUB R4','SUB R5','SUB R6','SUB R7', // 90
	'SUB R8','SUB R9','SUB R10','SUB R11','SUB R12','SUB R13','SUB R14','SUB R15',
	'LD R0', 'LD R1', 'LD R2', 'LD R3', 'LD R4', 'LD R5', 'LD R6', 'LD R7',  // A0
	'LD R8', 'LD R9', 'LD R10','LD R11','LD R12','LD R13','LD R14','LD R15', // A8
	'XCH R0','XCH R1','XCH R2','XCH R3','XCH R4','XCH R5','XCH R6','XCH R7', // B0
	'XCH R8','XCH R9','XCH R10','XCH R11','XCH R12','XCH R13','XCH R14','XCH R15',
	'BBL 0', 'BBL 1', 'BBL 2', 'BBL 3', 'BBL 4', 'BBL 5', 'BBL 6', 'BBL 7',  // C0
	'BBL 8', 'BBL 9', 'BBL 10','BBL 11','BBL 12','BBL 13','BBL 14','BBL 15', // C8
	'LDM 0', 'LDM 1', 'LDM 2', 'LDM 3', 'LDM 4', 'LDM 5', 'LDM 6', 'LDM 7',  // C0
	'LDM 8', 'LDM 9', 'LDM 10','LDM 11','LDM 12','LDM 13','LDM 14','LDM 15', // C8
	'WRM',   'WMP',   'WRR',   'WPM',   'WR0',   'WR1',   'WR2',   'WR3',    // E0
	'SBM',   'RDM',   'RDR',   'ADM',   'RD0',   'RD1',   'RD2',   'RD3',    // E8
	'CLB',   'CLC',   'IAC',   'CMC',   'CMA',   'RAL',   'RAR',   'TCC',    // F0
	'DAC',   'TCS',   'STC',   'DAA',   'KBP',   'DCL',   '???',   '???',    // F8

];

var steptab = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 00
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  // 10
  2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,  // 20
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 30
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  // 40
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  // 50
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 60
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  // 70
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 80
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // 90
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // A0
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // B0
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // C0
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // D0
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // E0
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  // F0
];

if(!Array.indexOf){
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++)
			if(this[i]==obj)return i;
		return -1;
	}
}

function DisAsmStep(pc) {
	var addr, ops1, ops2, disas, instr;
	instr=prom[pc];
	addr=getHexAddr(pc);
	ops1=getHexByte(instr); ops2='  ';
	disas=opctab[instr];
//	if (instr>0 && instr<15) disas+=' /i4040 ';
	if (steptab[instr]>1) {
		ops2=getHexByte(prom[pc+1]);
		if ((instr>0x3f) && (instr<0x60)) disas+=' $'+getHexAddr((((instr<<8) & 0xf00) | prom[pc+1]));
		else disas+=',$'+getHexByte(prom[pc+1]);
	}
	return([addr,ops1,ops2,disas]);
}

function getHexByte(data) {
	return ''+hextab[Math.floor(data/0x10)]+hextab[data&0x0f]
}

function getHexAddr(data) {
	return ''+hextab[Math.floor((data&0x0f00)/0x100)]+hextab[Math.floor((data&0x0f0)/0x10)]+hextab[data&0x00f]
}

// General functions
var endAddr=0;
var disArray = [];

function load(data,address){
	//*=$0068
	if (endAddr!=0) {alert("Press RESET before loading"); return;}
	var i,j=false, newAddress;
	address = address || 0;
	address = parseInt(address,16);
	data = data.toUpperCase();
	for(i=0; i<data.length; ++i){
	
		if(data[i] == "*" && data[i+1] == "=" && data[i+2] == "$"){
			address = parseInt( data[i+3]+data[i+4]+data[i+5]+data[i+6] ,16);
			
			i += 7;
			j = false; 
		}
		
		if( (data[i] >= "0" && data[i] <= "9") || (data[i] >= "A" && data[i] <= "F"))
			if(j === false)
				j=parseInt(data[i],16);
			else{
				prom[address++%0x1000] = ( j*0x10+parseInt(data[i],16) );
				j = false;
			}
	}
	endAddr=address;
	generateDisArray();
	show();
}

function generateDisArray(){
	disArray = [];
	var addr, i, dasm;
	i=addr=0;
	while(addr<endAddr){
		dasm = DisAsmStep(addr);
		if(dasm[2]!='  ') addr++
		dasm = disArray[i] = [ dasm[0],dasm[1]+' '+dasm[2], dasm[3], false ];
		i++; addr++;
	}
	dasm = disArray[0];
	disasm[0].innerHTML = dasm[0] +' '+ dasm[1];
	disasm[1].innerHTML = dasm[2];
}

function generateBPArray(){
	breakpoints = [];
	var bps, i, dasm;
	bps=0;
	for(i in disArray){
		dasm = disArray[i];
		if(dasm[3]) breakpoints[bps++] = dasm[0]; 
	}
}

function newElement(nameEl,parentEl, options){	
	var element = document.createElement(nameEl);
	parentEl.appendChild(element);
	if(options != null)
		for(var opt in options){
			element[opt] = options[opt];
		}
	return element;
}
									
function newWindow(obj,title,css){
		var el1,el2,style;
		var sFloat = document.all ? 'styleFloat' : 'cssFloat'; //float

		el1 = document.createElement('div');
		obj.insertBefore(el1,obj.firstChild);
		el1.className = 'handle';
		el1.onmousedown = function(e){ dragDrop(obj,e); };
		
		el2 = document.createElement('span');
		el1.appendChild(el2);
		el2.innerHTML = title;
		
		el2 = document.createElement('div');
		el1.appendChild(el2);
		el2.innerHTML = 'X';
		el2.style[sFloat] = 'right';
		el2.onclick = function(){ generateBPArray(); obj.style.display = 'none'; }
		
		obj.className = 'window';	
		for(style in css){
			obj.style[style] = css[style];
		}
	}

	function dragDrop(E,evt){
		var x,y, minX;
		var e=(evt)?evt:window.event;
		if (window.event) {
			e.cancelBubble=true;
		} else {
			e.stopPropagation();
			e.preventDefault();
		}
		x = ~~(e.layerX || e.offsetX); 
		y = ~~(e.layerY || e.offsetY); 
		minX = -( 0.8 * parseInt(E.style.width) );  
		E.getElementsByTagName('table')[0].style.display = 'none';

		document.onmouseup = function(){ this.onmousemove = null;	E.getElementsByTagName('table')[0].style.display = 'block';}
		document.onmousemove = function(e){
			e = e || event;
			e.preventDefault();
			E.style.left = (e.clientX + document.documentElement.scrollLeft - x) +'px'; 
			E.style.top = (e.clientY + document.documentElement.scrollTop - y) +'px'; 

			if(parseInt(E.style.left) < minX ) E.style.left = minX+'px';
			if(parseInt(E.style.top) < 0) E.style.top = 0;

			return false;
		}
	}

function show(){
	var ascii = '';
	var isAscii = document.getElementById('ascii').checked;
	var isDASM = document.getElementById('dasm').checked;
	var el = document.getElementById('data'),i,val="";
	var itemp;
	if(isDASM) {
		for (i in disArray) {
			itemp = disArray[i];
			val += itemp[0]+' '+itemp[1]+' '+itemp[2]+'\n';
		}
	}
	else {
		itemp=((endAddr+7)>>3)<<3;
		for(i=0; i<itemp; i++){
			if(i%0x8 == 0){
				if(isAscii){
					if(i != 0)
						val += " ;"+ascii;
					ascii = '';
				}
				if(i != 0)
				val += "\n";
				val += (i & 0xf00).toString(16)[0].toUpperCase();
				val += (i & 0xf0).toString(16)[0].toUpperCase();
				val += (i & 0xf).toString(16)[0].toUpperCase();
				val += ": "
			}
			val += (prom[i] & 0xf0).toString(16)[0].toUpperCase();
			val += (prom[i] & 0xf).toString(16)[0].toUpperCase();
		
			if(isAscii){
				if( (prom[i] >= "0".charCodeAt(0) && prom[i] <= "9".charCodeAt(0)) || (prom[i] >= "A".charCodeAt(0) && prom[i] <= "Z".charCodeAt(0)) || (prom[i] >= "a".charCodeAt(0) && prom[i] <= "z".charCodeAt(0)) )
					ascii += String.fromCharCode(prom[i]);
				else
					ascii += '.';
			}
			val += " ";
		}
		if(isAscii)
			val += " ;"+ascii;
	}
	el.value = val;
}

function getValue(mode){
	var val;
	if(mode){
		do{
			if(val) alert("Please write corect value")
			val = prompt('Please write number[0-F]:','');
			if(!val) return null;
		}while( !( (val[0] >= '0' && val[0] <= '9') || (val[0].toUpperCase() >= 'A' && val[0].toUpperCase() <= 'F')) );
		return val[0];	
	}	else {
		do{
			if(val) alert("Please write corect value")
			val = prompt('Please write number[000-FFF]:','');
			if(!val) return null;
			j = parseInt( val[0]+val[1]+val[2] ,16);
		}while( !( j >= 0 && j <= 0xfff) );
		return j;	
	}
}

function nextElement(el){
	while(el){
		el=el.nextSibling;
		if (el.nodeType==1)
			return el;
	}
}

function getRam(what){ return(what == 0) ? parseInt(select00.value*4)+parseInt(select01.value) : parseInt(select10.value*4)+parseInt(select11.value); }

function _resetRam(what){
	ramdata[ getRam(what) ] = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
	ramstatus[ getRam(what) ] = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]] ;
	ramout[ getRam(what) ] = 0;
	memory(false, what);
	status(false, what);
	outputs(false, what);
}

function _pc(isChange, j){
	var els, val, change;
	
	change = function(i,els){
		els[1+i*3].innerHTML = (PC_stack[i] & 0xf00).toString(16)[0].toUpperCase();
		els[2+i*3].innerHTML = (PC_stack[i] & 0xf0).toString(16)[0].toUpperCase();
		els[3+i*3].innerHTML = (PC_stack[i] & 0xf).toString(16)[0].toUpperCase();
	};
	
	isChange = isChange || false;
	els = pcElements;
		
	if(isChange){
		val = getValue(false);
		if(val == null)
			return;
		PC_stack[j] = val;
		change(j,els);
	} else
		for(j=0; j<4; ++j)
			change(j,els);
}

function _registers(isChange, i,j){
	var els, val, i;
	
	isChange = isChange || false;
	els = registersElements;
	
	if(isChange){
		val = getValue(true);
		if(val == null)
			return;
			 
		if(i<2)
			R_regs[i] = parseInt(val[0],16);
		else
			if( [2,3,6,7,10,11,14,15].indexOf(i) != -1)
				R_regs[i+j] = parseInt(val[0],16);
			else
				if(i%2 != 0)
				 R_regs[(i+1)/2] = parseInt(val[0],16);
				else
					R_regs[i/2] = parseInt(val[0],16);
					
		els[i+1].innerHTML = val[0].toUpperCase();	
	} else {
		j=0;
		for(i=1; els[i]; i+=2){
			els[i++].innerHTML = R_regs[j++].toString(16).toUpperCase();
			els[i++].innerHTML = R_regs[j++].toString(16).toUpperCase();
			if(i==15) i=1;
		}		
	}	
}

function _accu(isChange){
	var val;
	
	if(isChange){
		val = getValue(true);
		if(val == null)
			return;
		A_reg = parseInt(val,16);
	}
	el = accuElement;
	el.innerHTML = A_reg.toString(16).toUpperCase()+' [';
	el.innerHTML += (A_reg & 0x8).toString(2)[0]
	el.innerHTML +=	(A_reg & 0x4).toString(2)[0]
	el.innerHTML +=	(A_reg & 0x2).toString(2)[0]
	el.innerHTML +=	(A_reg & 0x1).toString(2)[0]+']';
}

function _carry(isChange){
	if(isChange)
		C_flag = ~~!C_flag;
	carryElement.checked = (C_flag ? true : false ); 
}

function _test(isChange){
	if(isChange)
		T_flag = ~~!T_flag;
	testElement.checked = (T_flag ? true : false ); 
}

function _cycles(){ cyclesElement.innerHTML = '<b>CYCLES:</b> '+(''+cpuCycles).toUpperCase(); }

function _disAsm(){
	var j = DisAsmStep( PC_stack[0] );
	disasm[0].innerHTML = j[0] +' '+ j[1]+' '+j[2];
	disasm[1].innerHTML = j[3];
}

function _port(isChange){
	var el;
	
	el = portElement;
	el[0].checked = (romport & 0x8).toString(2)[0] == 1 ? true : false;
	el[1].checked = (romport & 0x4).toString(2)[0] == 1 ? true : false;
	el[2].checked = (romport & 0x2).toString(2)[0] == 1 ? true : false;
	el[3].checked = (romport & 0x1).toString(2)[0] == 1 ? true : false;	
}

function _memory(isChange,what,td,k){
	var tds,j,k,td;
	tds = (what == 0) ? memory0Elements : memory1Elements;
	if(isChange){
		val = getValue(true);
		if(val == null)
				return;
		j = 0;
		while(k > 0xf){
			++j;
			k-=0x10;	
		}
		
		ramdata[ getRam(what) ][j][k] = parseInt(val,16);
		td.innerHTML = val.toUpperCase();				
	} else {
		j = k = 0;
		for(i=0; td=tds[i++];){
			td.innerHTML = ramdata[ getRam(what) ][j][k++].toString(16).toUpperCase();
			if(k == 16){ k = 0; ++j; }
		}
	}
}

function _status(isChange,what,td,k){
	var tds,j,k,td;
	tds = (what == 0) ? status0Elements : status1Elements;
	if(isChange){
		val = getValue(true);
		if(val == null)
				return;
		j = 0;
		while(k > 0x3){
			++j;
			k-=0x04;	
		}
		ramstatus[ getRam(what) ][j][k] = parseInt(val,16);
		td.innerHTML = val.toUpperCase();				
	} else {
		j = k = 0;
		for(i=0; td=tds[i++];){
			td.innerHTML = ramstatus[ getRam(what) ][j][k++].toString(16).toUpperCase();
			if(k == 4){ k = 0; ++j; }
		}
	}
}

function _outputs(isChange,what){
	var el = (what == 0) ? outputs0Elements : outputs1Elements;
	
	el[0].checked = (ramout[ getRam(what) ] & 0x8).toString(2)[0] == 1 ? true : false;
	el[1].checked = (ramout[ getRam(what) ] & 0x4).toString(2)[0] == 1 ? true : false;
	el[2].checked = (ramout[ getRam(what) ] & 0x2).toString(2)[0] == 1 ? true : false;
	el[3].checked = (ramout[ getRam(what) ] & 0x1).toString(2)[0] == 1 ? true : false;
}

function setRam( what ){
	var tds, td, i; 
	
	_memory(false, what);
	_status(false, what);
	_outputs(false, what);
	
	tds = (what == 0) ? memory0Elements : memory1Elements;
	for(i=0; td=tds[i++];){
		td.i = i-1;
		td.onclick = function(){ _memory(true, what, this, this.i); }
	}

	tds = (what == 0) ? status0Elements : status1Elements;
	for(i=0; td=tds[i++];){
		td.i = i-1;
		td.onclick = function(){ _status(true, what, this, this.i); }
	}
	
	document.getElementsByName('reset')[what].onclick = function(){ resetRam( what ) };
}

function refresh(what, h){
	switch(what){
		case 'pc': _pc(false); break;
		case 'registers': _registers(false); break;
		case 'accu': _accu(false); break;
		case 'test': _test(false); break;
		case 'carry': _carry(false); break;
		case 'cycles': _cycles(); break;
		case 'disAsm': _disAsm(); break;
		
		case 'memory': _memory(false, h); break;
		case 'status': _status(false, h); break;
		case 'outputs': _outputs(false, h); break;
		
		case 'port': _port(false, h); break;
	}
}

function setPc(){
	var tds, td, i, j;
	
	_pc(false);
	_registers(false);
	_accu(false);
	_carry(false);
	_test(false);
	_cycles();
	_disAsm();
	
	tds = document.getElementById('pc').getElementsByTagName('th');
	for(i=1; td=tds[i++];){
		td.i = i-2;
		td.onclick = function(){ _pc(true, this.i); }
	}
	
	j=6;
	tds = document.getElementById('registers').getElementsByTagName('th');
	for(i=0; td=tds[i++];){
		td.i = i-1;
		td.j = j; 
		if(i%4 == 0) j-=2;
		td.onclick = function(){ _registers(true, this.i, this.j); }
	}
	
	document.getElementById('accu').getElementsByTagName('b')[0].onclick = function(){ _accu(true); };
	document.getElementById('carry').getElementsByTagName('b')[0].onclick = function(){ _carry(true); };
	document.getElementById('test').getElementsByTagName('b')[0].onclick = function(){ _test(true); };
}

function changeAll(){
	_memory(false, 0);
	_status(false, 0);
	_outputs(false, 0);

	_memory(false, 1);
	_status(false, 1);
	_outputs(false, 1);
	
	_pc(false);
	_registers(false);
	_accu(false);
	_carry(false);
	_test(false);
	_cycles();
	_disAsm();
	
	_port(false);
}

window.onload = function(){
	pcElements = document.getElementById('pc').getElementsByTagName('td');
	registersElements = document.getElementById('registers').getElementsByTagName('td');
	accuElement = document.getElementById('accu').getElementsByTagName('span')[0];
	carryElement = document.getElementById('carry').getElementsByTagName('input')[0];
	testElement = document.getElementById('test').getElementsByTagName('input')[0];
	cyclesElement = document.getElementById('cycles');
	memory0Elements = document.getElementById('memory_0').getElementsByTagName('td');
	memory1Elements = document.getElementById('memory_1').getElementsByTagName('td');
	status0Elements = document.getElementById('status_0').getElementsByTagName('td');
	status1Elements = document.getElementById('status_1').getElementsByTagName('td');
	outputs0Elements = document.getElementById('outputs_0').getElementsByTagName('input');
	outputs1Elements = document.getElementById('outputs_1').getElementsByTagName('input');
	disasm = document.getElementById("dassem").getElementsByTagName('span');
	portElement = document.getElementById('port').getElementsByTagName('input');
	select00 = document.getElementById('select1-1');
	select01 = document.getElementById('select1-2');
	select10 = document.getElementById('select2-1');
	select11 = document.getElementById('select2-2');
	
	reset();
	mainLoop();
	
	document.getElementById('step').onclick = function(){ stepFlag = true; };
	document.getElementById('animate').onclick = function(){ animFlag=true; };
	document.getElementById('run').onclick = function(){ runFlag = true; };
	document.getElementById('stop').onclick = function(){ animFlag = runFlag = false; };
	document.getElementById('resetCPU').onclick = function(){
		resetCPU();
		_pc(false);
		_registers(false);
		_accu(false);
		_carry(false);
		_test(false);
		_cycles();
		_disAsm();
	}
	
	document.getElementById('load').onclick = function(){ load(document.getElementById('data').value,0); };

	document.getElementById('resetROM').onclick = function(){
		document.getElementById('break').innerHTML = '';
		clearROM(); disArray=[]; endAddr=0;
		document.getElementById('data').value = '';
	}

	document.getElementById('ascii').onchange = show;
	document.getElementById('dasm').onchange = show;
	
	
	document.getElementById('p1').onclick = function(){
		clearROM();
		document.getElementById('break').innerHTML = '';
		disArray=[]; endAddr=0;
		with(document.getElementById('hardware_0')){ checked = true; }
		load('20 00 22 00 DC B2 21 E0 F2 71 06 60 72 06 20 00 22 00 DC B2 21 E4 F2 E5 F2 E6 F2 E7 F2 60 72 14 40 20',0);
		testFlag=false;
		show();
	}

	document.getElementById('p2').onclick = function(){
		clearROM();
		document.getElementById('break').innerHTML = '';
		disArray=[]; endAddr=0;
		with(document.getElementById('hardware_1')){ checked = true; onchange(); }
		load('E2 CF 2A 41 50 DE 50 E5 30 FE 50 EE 50 E5 50 EE 50 E5 2A 42 5F FF 57 1A 48 24 5F FF 53 20 4C 18 5F FF 4F FF 22 CB F0 2B E1 21 E0 F2 71 29 E4 F2 E5 F2 E6 F2 E7 60 72 29 FA 50 F7 73 39 25 FA F5 E1 1A 47 1C 4F 19 50 12 50 14 52 11 43 40 45 F0 40 3F 2C 66 2E 59 20 00 3D 21 84 85 E0 F6 74 59 75 59 50 DE 40 75 50 DE 21 94 95 E0 F0 74 68 75 68 F0 2B E1 3F FA 68 A8 E0 B9 A9 E2 FB E0 74 75 F0 F8 E0 FC E0 74 81 F0 FB E0 F2 74 88 DF E0 F7 E0 1C 8D F0 2B E1 DF F9 E0 FA F9 E0 F3 F6 E0 74 9C 24 C0 21 E9 71 A3 EC ED EE EF 60 74 A3 20 20 22 30 21 E8 61 23 E8 E0 73 B2 20 00 20 10 F0 2B E1 21 EB 61 23 EB E0 73 C1 2B EC 14 D7 D8 21 E1 F0 2B E4 19 D3 40 20 F2 E4 D2 21 E1 40 20 2B AB F1 E1 F5 BB C0 21 23 25 27 29 2B 2D 2F C0 32 34 36 38 3A 3C 3E 30 C0 A4 F5 FD B4 EA C0 00 FF 00',0);
		testFlag=true;
		show();
	}


	document.getElementById('ra').onclick = function(){ 
		reset();
		disArray=[]; endAddr=0;
		document.getElementById('data').value = '';
		document.getElementById('break').innerHTML = '';
		animFlag = runFlag = testFlag = mcsFlag = false;
		with(document.getElementById('hardware_0')){ checked = true; onchange(); }
	}

	document.getElementById('bp').onclick = function(){
		var addr, i, dasm, table, tr, td;
		if(endAddr == 0){ alert('Load program please'); return; }
		if( document.getElementById('break').getElementsByTagName('table')[0] ){
			document.getElementById('break').style.display = 'block';
			return;
		}
		newWindow(document.getElementById('break'), 'BREAKPOINTS',
			{'width': '230px', 'height': '402px', 'top': ((window.screen.height+document.documentElement.scrollTop - 502) / 2)+'px', 'left': ((window.screen.width - 230) / 2)+'px'});
		table = newElement('table',document.getElementById('break'),null);
		table = newElement('tbody',table,null);
		i=0; dasm = disArray[i];
		do{
			tr = newElement('tr',table);
			tr.i = i;
			tr.style.backgroundColor = 'yellow';
			tr.onclick = function(){ 
				if(this.style.backgroundColor == 'yellow'){
				 this.style.backgroundColor = 'red';
				 disArray[this.i][3] = true;
				} else {
			 	 this.style.backgroundColor = 'yellow';
			 	 disArray[this.i][3] = false;
				}
			}

			newElement('td',tr, { 'innerHTML':dasm[0] || ''} );
			newElement('td',tr, { 'innerHTML':dasm[1] || ''} );
			newElement('td',tr, { 'innerHTML':dasm[2] || ''} );
			dasm = disArray[++i]
		} while(dasm && dasm[0][0].indexOf(' ') == -1);
		
		newElement('input',document.getElementById('break'), { 'type': 'button', 'value': 'clear all', 'onclick': function(){
			var i,els,el;
			els = document.getElementById('break').getElementsByTagName('tr');
			for(i=0; el = els[i]; ++i){
				disArray[i][3] = false;
				els[i].style.backgroundColor = 'yellow';
			}
		}} );
		newElement('input',document.getElementById('break'), { 'type': 'button', 'value': 'exit', 'onclick': function(){
			generateBPArray();
			document.getElementById('break').style.display = 'none';
		} } );
	};

	select00.onchange = function(){ setRam(0); };
	select01.onchange = function(){ setRam(0); };
	select10.onchange = function(){ setRam(1); };
	select11.onchange = function(){ setRam(1); };
	
	setRam(0);
	setRam(1);
	setPc();
}


// eof
