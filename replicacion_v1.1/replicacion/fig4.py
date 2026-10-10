import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams.update({'font.family':'serif','font.size':8,'axes.spines.top':False,'axes.spines.right':False})
d=json.load(open('series.json')); x=range(1,366)
fig,axs=plt.subplots(1,2,figsize=(4.8,2.0),sharey=True,dpi=300)
sty={'S1 Favorable':('#1b1b1b','-','S1 Favorable'),'S2 High temperature':('#c0392b','--','S2 High temp.'),'S3 Dry season':('#2e6da4','-.','S3 Dry season'),
     'S4 Dense shade':('#7a7a7a',(0,(1,1)),'S4 Dense shade'),'S5 Fungicide':('#2e8b57','--','S5 Fungicide'),'S6 Dense shade + fungicide':('#8e44ad','-.','S6 Shade + fung.')}
groups=[('(a) Climate scenarios',['S1 Favorable','S2 High temperature','S3 Dry season'],dict(loc='upper right')),('(b) Management scenarios',['S1 Favorable','S4 Dense shade','S5 Fungicide','S6 Dense shade + fungicide'],dict(loc='upper right'))]
for ax,(t,ks,lk) in zip(axs,groups):
    for k in ks:
        c,ls,lab=sty[k]; ax.fill_between(x,d[k]['lo'],d[k]['hi'],color=c,alpha=.15,lw=0); ax.plot(x,d[k]['mean'],color=c,ls=ls,lw=1,label=lab)
    ax.set_title(t,fontsize=8,loc='left'); ax.set_xlabel('Simulated day'); ax.set_xlim(0,365); ax.set_ylim(0,100); ax.set_xticks([0,90,180,270,365])
    ax.legend(frameon=False,fontsize=6,labelspacing=0.3,**lk); ax.grid(axis='y',lw=.3,color='#ddd')
axs[0].set_ylabel('Infected plots (%)')
fig.tight_layout(); fig.savefig('fig4.png',dpi=300)
