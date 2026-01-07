/*
   Intel 4004 microprocessor JavaScript emulator
   by Maciej Szyc 2006, e4004'at'szyc.org
   
   based on 6502 JavaScript emulator by N.Landsteiner
   
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
*/

// global conf

var debug=false;

// system regs & memory

/*
    A | 4bits  | Accumulator
   PC | 12bits | 1 of 4 Stack Pointer Registers (PC_stack)
    R | 16bits | 1 of 16 Scratchpad Registers
    C | 1bit   | Carry
    T | 1bit   | Test pin
*/

var A_reg, C_flag, T_flag;

var PC_stack=new Array(4);
var sp=0;

var R_regs=new Array(16);

var cmram, ramaddr;
var ph, pm, pl;

var cmrom, romport;

var prom=new Array(4096)

var ramdata=new Array(16)
for (i=0; i <16; i++) {
 ramdata[i]=new Array(4);
 for (j=0; j <4; j++) {
  ramdata[i][j]=new Array(16);
 }
}

var ramstatus=new Array(16)
for (i=0; i <16; i++) {
 ramstatus[i]=new Array(4);
 for (j=0; j <4; j++) {
  ramstatus[i][j]=new Array(4);
 }
}

var ramout=new Array(16)

var breakpoints = [];

var temp;

var testFlag=false;
var animFlag=false;
var runFlag=false;
var stepFlag=false;

// functions

function incPC() { PC_stack[0]++; PC_stack[0]&=0xfff; if(testFlag) PC_stack[0]&=0xff;}

function nextCode() {incPC(); return prom[PC_stack[0]] & 0xff; }

function activeCode() {return prom[PC_stack[0]] & 0xff; }

function setRpar(rpar,pset) {	//Set Register Pair
  R_regs[2*rpar+1]=pset&0xf;
  R_regs[2*rpar]=(pset>>4)&0xf;
}

function getRpar(rpar) {	//Get Register Pair
  return((R_regs[2*rpar]<<4)&0xf0 | R_regs[2*rpar+1]&0xf);
}

function ramAdrDecoder() {
  switch(cmram) {
    case 1:		//RAM bank 0
      ph = ramaddr>>6;
      break;
    case 2:		//RAM bank 1
      ph = 0x4 | ramaddr>>6;
      break;
    case 4:		//RAM bank 2
      ph = 0x8 | ramaddr>>6;
      break;
    case 8:		//RAM bank 3
      ph = 0xC | ramaddr>>6;
      break;
  }
  if(testFlag) ph &= 0x1;
  pm = (ramaddr & 0x30)>>4;
  pl = ramaddr & 0xf;
}

function opJCN(cond) {	//JCN jump conditionally
  var invert=0;
  if (cond&0x8) invert=1;
  temp = PC_stack[0]&0xf00;
  temp |= nextCode(); incPC();
  if (cond&0x4) {if((!A_reg)^invert) PC_stack[0]=temp;} // if accu is zero
  if (cond&0x2) {if((C_flag)^invert) PC_stack[0]=temp;} // if carry
  if (cond&0x1) {if((T_flag)^invert) PC_stack[0]=temp;} // if test
}

function opFIM(rpar) {	//FIM Fetch Immediate
  setRpar(rpar,nextCode()); incPC();
}

function opSRC(rpar) {	//SRC Send Register Control
  ramaddr=getRpar(rpar); incPC();
}

function opFIN(rpar) {	//FIN Fetch Indirect
  setRpar(rpar, prom[(PC_stack[0]&0xf00) | getRpar(0)]);
  incPC();
}

function opJIN(rpar) {	//JIN Jump Indirect
  PC_stack[0] = (PC_stack[0]&0xf00) | getRpar(rpar);
  if(testFlag) PC_stack[0]&=0xff;
}

function opJUN(addr) {	//JUN Jump Uncoditional
  PC_stack[0] = addr | nextCode();
  if(testFlag) PC_stack[0]&=0xff;
}

function opJMS(addr) {	//JMS Jump to Subroutine
  temp = addr | nextCode();
  if (sp<3) {
    sp++;
    for(i=sp; i>0; i--) PC_stack[i]=PC_stack[i-1];
    PC_stack[0]=temp;
    if(testFlag) PC_stack[0]&=0xff;
  }
  else {
    incPC();
    if (debug) alert('Stack overflow');
  }
}

function opINC(reg) {	//INC Increment
  R_regs[reg]++;
  if (R_regs[reg] & 0xf0) R_regs[reg]=0;
  incPC();
}

function opISZ(reg) {	//ISZ Increment and Skip
  temp = nextCode();
  R_regs[reg] = (R_regs[reg] + 1)&0xf;
  if(R_regs[reg]) PC_stack[0] = (PC_stack[0]&0xf00) | temp;
  else incPC();
}

function opADD(reg) {	//ADD Add
  A_reg = A_reg + R_regs[reg] + C_flag;
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opSUB(reg) {	//SUB Subtract
  A_reg = A_reg + (~R_regs[reg]&0xf) + (~C_flag&1);
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opLD(reg) {	//LD Load
  A_reg = R_regs[reg]; incPC();
}

function opXCH(reg) {	//XCH Exchange
  temp = A_reg;
  A_reg = R_regs[reg];
  R_regs[reg] = temp;
  incPC();
}

function opBBL(data) {	//BBL Branch Back and Load
  if (sp>0) {
    for(i=0; i<sp; i++) PC_stack[i]=PC_stack[i+1];
    PC_stack[sp]=0;
    sp--; A_reg = data;
  }
  else {
    if (debug) alert('Stack error');
  }
  incPC();
}

function opLDM(data) {	//LDM Load Immediate
  A_reg = data; incPC();
}

function opWRM() {	//WRM Write Main Memory
  ramAdrDecoder();
  ramdata[ph][pm][pl] = A_reg;
  incPC();
}

function opWMP() {	//WMP Write RAM Port
  ramAdrDecoder();
  ramout[ph] = A_reg;
  if(testFlag) T_flag = ramout[0]&0x1;
  incPC();
}

function opWRR() {	//WRR Write ROM Port
  romport = A_reg;
  incPC();
}

function opWR(status) {	//WRx Write Status Char
  ramAdrDecoder();
  ramstatus[ph][pm][status] = A_reg;
  incPC();
}

function opSBM() {	//SBM Subtract Main Memory
  ramAdrDecoder();
  A_reg = A_reg + ((~ramdata[ph][pm][pl])&0xf) + (~C_flag&1);
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opRDM() {	//RDM Read Main Memory
  ramAdrDecoder();
  A_reg = ramdata[ph][pm][pl];
  incPC();
}

function opRDR() {	//RDR Read ROM Port
  if(testFlag) romport = ramout[1];
  A_reg = romport;
  incPC();
}

function opADM() {	//ADM Add Main Memory
  ramAdrDecoder();
  A_reg = A_reg + ramdata[ph][pm][pl] + C_flag;
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opRD(status) {	//RDx Read Status Char
  ramAdrDecoder();
  A_reg = ramstatus[ph][pm][status];
  incPC();
}

function opCLB() {	//CLB Clear Both
  A_reg=0; C_flag=0; incPC();
}

function opCLC() {	//CLC Clear Carry
  C_flag=0; incPC();
}

function opIAC() {	//IAC Increment Accumulator
  A_reg++;
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opCMC() {	//CMC Complement Carry
  C_flag= (C_flag==1) ? 0 : 1; incPC();
}

function opCMA() {	//CMA Complement
  A_reg = (~A_reg) & 0xf; incPC();
}

function opRAL() {	//RAL Rotate Left
  A_reg = (A_reg<<1) | C_flag;
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opRAR() {	//RAR Rotate Right
  temp = A_reg & 1;
  A_reg = (A_reg>>1) | (C_flag<<3);
  C_flag = temp; incPC();
}

function opTCC() {	//TCC Transfer Carry and Clear
  A_reg = C_flag; C_flag = 0; incPC();
}

function opDAC() {	//DAC Decrement Accumulator
  A_reg+=0xf;
  C_flag=0; if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opTCS() {	//TCS Transfer Carry Subtract
  A_reg = 9 + C_flag;
  C_flag = 0; incPC();
}

function opSTC() {	//STC Set Carry
  C_flag=1; incPC();
}

function opDAA() {	//DAA Decimal Adjust Accumulator
  if(A_reg > 9 || C_flag==1) A_reg += 6;
  if (A_reg & 0xf0) {A_reg&=0xf; C_flag=1;}
  incPC();
}

function opKBP() {	//KBP Keybord Process
  switch(A_reg) {
	case 0:
		A_reg = 0;
		break;
	case 1:
		A_reg = 1;
		break;
	case 2:
		A_reg = 2;
		break;
	case 4:
		A_reg = 3;
		break;
	case 8:
		A_reg = 4;
		break;
	default:
		A_reg = 15;
		break;
  }
  incPC();
}

function opDCL() {	//DCL Designate Command Line
  switch(A_reg&0x7) {
    case 0:
      cmram=1; break;
    case 1:
      cmram=2; break;
    case 2:
      cmram=4; break;
    case 3:
      cmram=3; break;
    case 4:
      cmram=8; break;
    case 5:
      cmram=10; break;
    case 6:
      cmram=12; break;
    case 7:
      cmram=14; break;
  }
  incPC();
}

// instructions

function i00() { incPC(); }	//NOP No Operation

function i10() { opJCN(0); }	//JCN jump conditionally
function i11() { opJCN(1); }	//JCN jump conditionally
function i12() { opJCN(2); }	//JCN jump conditionally
function i13() { opJCN(3); }	//JCN jump conditionally
function i14() { opJCN(4); }	//JCN jump conditionally
function i15() { opJCN(5); }	//JCN jump conditionally
function i16() { opJCN(6); }	//JCN jump conditionally
function i17() { opJCN(7); }	//JCN jump conditionally
function i18() { opJCN(8); }	//JCN jump conditionally
function i19() { opJCN(9); }	//JCN jump conditionally
function i1a() { opJCN(10); }	//JCN jump conditionally
function i1b() { opJCN(11); }	//JCN jump conditionally
function i1c() { opJCN(12); }	//JCN jump conditionally
function i1d() { opJCN(13); }	//JCN jump conditionally
function i1e() { opJCN(14); }	//JCN jump conditionally
function i1f() { opJCN(15); }	//JCN jump conditionally

function i20() { opFIM(0); }	//FIM Fetch Immediate
function i21() { opSRC(0); }	//SRC Send Register Control
function i22() { opFIM(1); }	//FIM Fetch Immediate
function i23() { opSRC(1); }	//SRC Send Register Control
function i24() { opFIM(2); }	//FIM Fetch Immediate
function i25() { opSRC(2); }	//SRC Send Register Control
function i26() { opFIM(3); }	//FIM Fetch Immediate
function i27() { opSRC(3); }	//SRC Send Register Control
function i28() { opFIM(4); }	//FIM Fetch Immediate
function i29() { opSRC(4); }	//SRC Send Register Control
function i2a() { opFIM(5); }	//FIM Fetch Immediate
function i2b() { opSRC(5); }	//SRC Send Register Control
function i2c() { opFIM(6); }	//FIM Fetch Immediate
function i2d() { opSRC(6); }	//SRC Send Register Control
function i2e() { opFIM(7); }	//FIM Fetch Immediate
function i2f() { opSRC(7); }	//SRC Send Register Control

function i30() { opFIN(0); }	//FIN Fetch Indirect
function i31() { opJIN(0); }	//JIN Jump Indirect
function i32() { opFIN(1); }	//FIN Fetch Indirect
function i33() { opJIN(1); }	//JIN Jump Indirect
function i34() { opFIN(2); }	//FIN Fetch Indirect
function i35() { opJIN(2); }	//JIN Jump Indirect
function i36() { opFIN(3); }	//FIN Fetch Indirect
function i37() { opJIN(3); }	//JIN Jump Indirect
function i38() { opFIN(4); }	//FIN Fetch Indirect
function i39() { opJIN(4); }	//JIN Jump Indirect
function i3a() { opFIN(5); }	//FIN Fetch Indirect
function i3b() { opJIN(5); }	//JIN Jump Indirect
function i3c() { opFIN(6); }	//FIN Fetch Indirect
function i3d() { opJIN(6); }	//JIN Jump Indirect
function i3e() { opFIN(7); }	//FIN Fetch Indirect
function i3f() { opJIN(7); }	//JIN Jump Indirect

function i40() { opJUN(0x000); }	//JUN Jump Uncoditional
function i41() { opJUN(0x100); }	//JUN Jump Uncoditional
function i42() { opJUN(0x200); }	//JUN Jump Uncoditional
function i43() { opJUN(0x300); }	//JUN Jump Uncoditional
function i44() { opJUN(0x400); }	//JUN Jump Uncoditional
function i45() { opJUN(0x500); }	//JUN Jump Uncoditional
function i46() { opJUN(0x600); }	//JUN Jump Uncoditional
function i47() { opJUN(0x700); }	//JUN Jump Uncoditional
function i48() { opJUN(0x800); }	//JUN Jump Uncoditional
function i49() { opJUN(0x900); }	//JUN Jump Uncoditional
function i4a() { opJUN(0xa00); }	//JUN Jump Uncoditional
function i4b() { opJUN(0xb00); }	//JUN Jump Uncoditional
function i4c() { opJUN(0xc00); }	//JUN Jump Uncoditional
function i4d() { opJUN(0xd00); }	//JUN Jump Uncoditional
function i4e() { opJUN(0xe00); }	//JUN Jump Uncoditional
function i4f() { opJUN(0xf00); }	//JUN Jump Uncoditional

function i50() { opJMS(0x000); }	//JMS Jump to Subroutine
function i51() { opJMS(0x100); }	//JMS Jump to Subroutine
function i52() { opJMS(0x200); }	//JMS Jump to Subroutine
function i53() { opJMS(0x300); }	//JMS Jump to Subroutine
function i54() { opJMS(0x400); }	//JMS Jump to Subroutine
function i55() { opJMS(0x500); }	//JMS Jump to Subroutine
function i56() { opJMS(0x600); }	//JMS Jump to Subroutine
function i57() { opJMS(0x700); }	//JMS Jump to Subroutine
function i58() { opJMS(0x800); }	//JMS Jump to Subroutine
function i59() { opJMS(0x900); }	//JMS Jump to Subroutine
function i5a() { opJMS(0xa00); }	//JMS Jump to Subroutine
function i5b() { opJMS(0xb00); }	//JMS Jump to Subroutine
function i5c() { opJMS(0xc00); }	//JMS Jump to Subroutine
function i5d() { opJMS(0xd00); }	//JMS Jump to Subroutine
function i5e() { opJMS(0xe00); }	//JMS Jump to Subroutine
function i5f() { opJMS(0xf00); }	//JMS Jump to Subroutine

function i60() { opINC(0); }	//INC Increment
function i61() { opINC(1); }	//INC Increment
function i62() { opINC(2); }	//INC Increment
function i63() { opINC(3); }	//INC Increment
function i64() { opINC(4); }	//INC Increment
function i65() { opINC(5); }	//INC Increment
function i66() { opINC(6); }	//INC Increment
function i67() { opINC(7); }	//INC Increment
function i68() { opINC(8); }	//INC Increment
function i69() { opINC(9); }	//INC Increment
function i6a() { opINC(10); }	//INC Increment
function i6b() { opINC(11); }	//INC Increment
function i6c() { opINC(12); }	//INC Increment
function i6d() { opINC(13); }	//INC Increment
function i6e() { opINC(14); }	//INC Increment
function i6f() { opINC(15); }	//INC Increment

function i70() { opISZ(0); }	//ISZ Increment and Skip
function i71() { opISZ(1); }	//ISZ Increment and Skip
function i72() { opISZ(2); }	//ISZ Increment and Skip
function i73() { opISZ(3); }	//ISZ Increment and Skip
function i74() { opISZ(4); }	//ISZ Increment and Skip
function i75() { opISZ(5); }	//ISZ Increment and Skip
function i76() { opISZ(6); }	//ISZ Increment and Skip
function i77() { opISZ(7); }	//ISZ Increment and Skip
function i78() { opISZ(8); }	//ISZ Increment and Skip
function i79() { opISZ(9); }	//ISZ Increment and Skip
function i7a() { opISZ(10); }	//ISZ Increment and Skip
function i7b() { opISZ(11); }	//ISZ Increment and Skip
function i7c() { opISZ(12); }	//ISZ Increment and Skip
function i7d() { opISZ(13); }	//ISZ Increment and Skip
function i7e() { opISZ(14); }	//ISZ Increment and Skip
function i7f() { opISZ(15); }	//ISZ Increment and Skip

function i80() { opADD(0); }	//ADD Add
function i81() { opADD(1); }	//ADD Add
function i82() { opADD(2); }	//ADD Add
function i83() { opADD(3); }	//ADD Add
function i84() { opADD(4); }	//ADD Add
function i85() { opADD(5); }	//ADD Add
function i86() { opADD(6); }	//ADD Add
function i87() { opADD(7); }	//ADD Add
function i88() { opADD(8); }	//ADD Add
function i89() { opADD(9); }	//ADD Add
function i8a() { opADD(10); }	//ADD Add
function i8b() { opADD(11); }	//ADD Add
function i8c() { opADD(12); }	//ADD Add
function i8d() { opADD(13); }	//ADD Add
function i8e() { opADD(14); }	//ADD Add
function i8f() { opADD(15); }	//ADD Add

function i90() { opSUB(0); }	//SUB Subtract
function i91() { opSUB(1); }	//SUB Subtract
function i92() { opSUB(2); }	//SUB Subtract
function i93() { opSUB(3); }	//SUB Subtract
function i94() { opSUB(4); }	//SUB Subtract
function i95() { opSUB(5); }	//SUB Subtract
function i96() { opSUB(6); }	//SUB Subtract
function i97() { opSUB(7); }	//SUB Subtract
function i98() { opSUB(8); }	//SUB Subtract
function i99() { opSUB(9); }	//SUB Subtract
function i9a() { opSUB(10); }	//SUB Subtract
function i9b() { opSUB(11); }	//SUB Subtract
function i9c() { opSUB(12); }	//SUB Subtract
function i9d() { opSUB(13); }	//SUB Subtract
function i9e() { opSUB(14); }	//SUB Subtract
function i9f() { opSUB(15); }	//SUB Subtract

function ia0() { opLD(0); }	//LD Load
function ia1() { opLD(1); }	//LD Load
function ia2() { opLD(2); }	//LD Load
function ia3() { opLD(3); }	//LD Load
function ia4() { opLD(4); }	//LD Load
function ia5() { opLD(5); }	//LD Load
function ia6() { opLD(6); }	//LD Load
function ia7() { opLD(7); }	//LD Load
function ia8() { opLD(8); }	//LD Load
function ia9() { opLD(9); }	//LD Load
function iaa() { opLD(10); }	//LD Load
function iab() { opLD(11); }	//LD Load
function iac() { opLD(12); }	//LD Load
function iad() { opLD(13); }	//LD Load
function iae() { opLD(14); }	//LD Load
function iaf() { opLD(15); }	//LD Load

function ib0() { opXCH(0); }	//XCH Exchange
function ib1() { opXCH(1); }	//XCH Exchange
function ib2() { opXCH(2); }	//XCH Exchange
function ib3() { opXCH(3); }	//XCH Exchange
function ib4() { opXCH(4); }	//XCH Exchange
function ib5() { opXCH(5); }	//XCH Exchange
function ib6() { opXCH(6); }	//XCH Exchange
function ib7() { opXCH(7); }	//XCH Exchange
function ib8() { opXCH(8); }	//XCH Exchange
function ib9() { opXCH(9); }	//XCH Exchange
function iba() { opXCH(10); }	//XCH Exchange
function ibb() { opXCH(11); }	//XCH Exchange
function ibc() { opXCH(12); }	//XCH Exchange
function ibd() { opXCH(13); }	//XCH Exchange
function ibe() { opXCH(14); }	//XCH Exchange
function ibf() { opXCH(15); }	//XCH Exchange

function ic0() { opBBL(0); }	//BBL Branch Back and Load
function ic1() { opBBL(1); }	//BBL Branch Back and Load
function ic2() { opBBL(2); }	//BBL Branch Back and Load
function ic3() { opBBL(3); }	//BBL Branch Back and Load
function ic4() { opBBL(4); }	//BBL Branch Back and Load
function ic5() { opBBL(5); }	//BBL Branch Back and Load
function ic6() { opBBL(6); }	//BBL Branch Back and Load
function ic7() { opBBL(7); }	//BBL Branch Back and Load
function ic8() { opBBL(8); }	//BBL Branch Back and Load
function ic9() { opBBL(9); }	//BBL Branch Back and Load
function ica() { opBBL(10); }	//BBL Branch Back and Load
function icb() { opBBL(11); }	//BBL Branch Back and Load
function icc() { opBBL(12); }	//BBL Branch Back and Load
function icd() { opBBL(13); }	//BBL Branch Back and Load
function ice() { opBBL(14); }	//BBL Branch Back and Load
function icf() { opBBL(15); }	//BBL Branch Back and Load

function id0() { opLDM(0); }	//LDM Load Immediate
function id1() { opLDM(1); }	//LDM Load Immediate
function id2() { opLDM(2); }	//LDM Load Immediate
function id3() { opLDM(3); }	//LDM Load Immediate
function id4() { opLDM(4); }	//LDM Load Immediate
function id5() { opLDM(5); }	//LDM Load Immediate
function id6() { opLDM(6); }	//LDM Load Immediate
function id7() { opLDM(7); }	//LDM Load Immediate
function id8() { opLDM(8); }	//LDM Load Immediate
function id9() { opLDM(9); }	//LDM Load Immediate
function ida() { opLDM(10); }	//LDM Load Immediate
function idb() { opLDM(11); }	//LDM Load Immediate
function idc() { opLDM(12); }	//LDM Load Immediate
function idd() { opLDM(13); }	//LDM Load Immediate
function ide() { opLDM(14); }	//LDM Load Immediate
function idf() { opLDM(15); }	//LDM Load Immediate

function ie0() { opWRM(); }	//WRM Write Main Memory
function ie1() { opWMP(); }	//WMP Write RAM Port
function ie2() { opWRR(); }	//WRR Write ROM Port
function ie4() { opWR(0); }	//WR0 Write Status Char 0
function ie5() { opWR(1); }	//WR1 Write Status Char 1
function ie6() { opWR(2); }	//WR2 Write Status Char 2
function ie7() { opWR(3); }	//WR3 Write Status Char 3
function ie8() { opSBM(); }	//SBM Subtract Main Memory
function ie9() { opRDM(); }	//RDM Read Main Memory
function iea() { opRDR(); }	//RDR Read ROM Port
function ieb() { opADM(); }	//ADM Add Main Memory
function iec() { opRD(0); }	//RD0 Read Status Char 0
function ied() { opRD(1); }	//RD1 Read Status Char 1
function iee() { opRD(2); }	//RD2 Read Status Char 2
function ief() { opRD(3); }	//RD3 Read Status Char 3

function if0() { opCLB(); }	//CLB Clear Both
function if1() { opCLC(); }	//CLC Clear Carry
function if2() { opIAC(); }	//IAC Increment Accumulator
function if3() { opCMC(); }	//CMC Complement Carry
function if4() { opCMA(); }	//CMA Complement
function if5() { opRAL(); }	//RAL Rotate Left
function if6() { opRAR(); }	//RAR Rotate Right
function if7() { opTCC(); }	//TCC Transfer Carry and Clear
function if8() { opDAC(); }	//DAC Decrement Accumulator
function if9() { opTCS(); }	//TCS Transfer Carry Subtract
function ifa() { opSTC(); }	//STC Set Carry
function ifb() { opDAA(); }	//DAA Decimal Adjust Accumulator
function ifc() { opKBP(); }	//KBP Keybord Process
function ifd() { opDCL(); }	//DCL Designate Command Line

function ini() {
	if (debug) alert('Not implemented');
	incPC();
}

// code pages

var codes = [
  i00, ini, ini, ini, ini, ini, ini, ini,
  ini, ini, ini, ini, ini, ini, ini, ini,
  i10, i11, i12, i13, i14, i15, i16, i17,
  i18, i19, i1a, i1b, i1c, i1d, i1e, i1f,
  i20, i21, i22, i23, i24, i25, i26, i27,
  i28, i29, i2a, i2b, i2c, i2d, i2e, i2f,
  i30, i31, i32, i33, i34, i35, i36, i37,
  i38, i39, i3a, i3b, i3c, i3d, i3e, i3f,
  i40, i41, i42, i43, i44, i45, i46, i47,
  i48, i49, i4a, i4b, i4c, i4d, i4e, i4f,
  i50, i51, i52, i53, i54, i55, i56, i57,
  i58, i59, i5a, i5b, i5c, i5d, i5e, i5f,
  i60, i61, i62, i63, i64, i65, i66, i67,
  i68, i69, i6a, i6b, i6c, i6d, i6e, i6f,
  i70, i71, i72, i73, i74, i75, i76, i77,
  i78, i79, i7a, i7b, i7c, i7d, i7e, i7f,
  i80, i81, i82, i83, i84, i85, i86, i87,
  i88, i89, i8a, i8b, i8c, i8d, i8e, i8f,
  i90, i91, i92, i93, i94, i95, i96, i97,
  i98, i99, i9a, i9b, i9c, i9d, i9e, i9f,
  ia0, ia1, ia2, ia3, ia4, ia5, ia6, ia7,
  ia8, ia9, iaa, iab, iac, iad, iae, iaf,
  ib0, ib1, ib2, ib3, ib4, ib5, ib6, ib7,
  ib8, ib9, iba, ibb, ibc, ibd, ibe, ibf,
  ic0, ic1, ic2, ic3, ic4, ic5, ic6, ic7,
  ic8, ic9, ica, icb, icc, icd, ice, icf,
  id0, id1, id2, id3, id4, id5, id6, id7,
  id8, id9, ida, idb, idc, idd, ide, idf,
  ie0, ie1, ie2, ini, ie4, ie5, ie6, ie7,
  ie8, ie9, iea, ieb, iec, ied, iee, ief,
  if0, if1, if2, if3, if4, if5, if6, if7,
  if8, if9, ifa, ifb, ifc, ifd, ini, ini
];

var cycles = [
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
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1   // F0
];


// main

var cpuCycles;

//main
function mainLoop() {
  // Program runing
  if(stepFlag) {
     cpuLoop(1);
     stepFlag=false;
  }
  if(animFlag) {
     cpuLoop(1);
  }
  if(runFlag) {
     cpuLoop(12500);
  }
  
  setTimeout("mainLoop()",0);
}

function cpuLoop(cycleLimit) {
  var code;
  cycleLimit += cpuCycles;
  while(cpuCycles<cycleLimit) {
    code=activeCode();
    codes[code]();
    cpuCycles+=cycles[code];
    if((breakpoints.indexOf(getHexAddr(PC_stack[0])) != -1) && !stepFlag) {
      alert("Stop at: "+getHexAddr(PC_stack[0])+" (breakpoint)");
      animFlag=false;
      runFlag=false;
      break;
    }
  }
  changeAll();
}

function resetCPU() {
	A_reg=C_flag=T_flag=0;
	PC_stack = [0,0,0,0];
	sp=0;
	for (i=0; i <16; i++) R_regs[i]=0;
	cmram=1; ramaddr=0;
	cmrom=0;
	animFlag=false;
	runFlag=false;
	stepFlag=false;
	cpuCycles=0;
}

function clearRAM(){
 var i,j,k;

 for (i=0; i <16; i++)
  for (j=0; j <4; j++)
   for (k=0; k <16; k++)
    ramdata[i][j][k] = 0;

 for (i=0; i <16; i++)
  for (j=0; j <4; j++)
   for (k=0; k <4; k++)
    ramstatus[i][j][k] = 0;

 for (i=0; i <16; i++)  ramout[i] = 0;
}

function clearROM() {
  for(i=0; i<=0xfff; ++i) prom[i] = 0;
  romport=0;
}

function reset() {
  resetCPU();
  clearRAM();
  clearROM();
  changeAll();
}


// end of 4004
