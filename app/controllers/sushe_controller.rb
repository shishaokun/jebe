class SusheController < ApplicationController
  layout 'sushe'
  def profile
  end

  def at
    list = {
      candidate: [{
        id: 344,
        name: 'jack',
        avatar: 'http://hdn.xnimg.cn/photos/hdn121/20121011/1435/h_tiny_Lxpv_050e000008aa1375.jpg'
        }]
    }
    render :json => list
  end
end
