# INNOVATION IDEAS

## Candidate ideas
- [candidate] 将弱信号多普勒提取与双星座鲁棒赋权联动：先做弱信号 Doppler 质量评估，再把该质量指标送入 HVCE/鲁棒 WLS 权重更新，而不是只按星座或高度角赋权。
- [candidate] 面向 Iridium + ORBCOMM 的分层加权模型：星座层做方差分量估计，观测层做 IGG-III 或 Huber 抑制，以兼顾双星座互补性和异常值鲁棒性。
- [candidate] 在伪距不足场景中引入“伪距 + 伪距率/多普勒”混合解算，并显式建模不同观测类型的噪声迁移关系，提升 GNSS 拒止时的可用性。
