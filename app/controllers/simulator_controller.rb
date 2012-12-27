class SimulatorController < ApplicationController
  def index
  	file = File.dirname($0) + '../../../template/setting.html'
    @setting = IO.read(file)
    file = File.dirname($0) + '../../../template/runtime.html'
    @runtime = IO.read(file)
    respond_to do |format|
      format.html
    end
  end
end
